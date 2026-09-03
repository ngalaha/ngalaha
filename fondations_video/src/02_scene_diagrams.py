"""
Etape 2 : Découpage en scènes visuelles (3-8s) + association de chaque
scène à une catégorie de diagramme technique (style plan d'architecte).

Les scènes consécutives partageant la même catégorie sont regroupées en
"panneaux" (comme les planches numérotées 01, 02, 03... de la référence) :
le diagramme et le titre restent stables pendant qu'un même sujet est
développé, la légende en bas suit elle le texte de chaque scène.

Usage:
    python3 src/02_scene_diagrams.py

Entrée:
    output/transcript.json  (produit par 01_transcribe.py ou la variante Termux)
Sortie:
    output/scenes.json
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "output")

MIN_DUR = 3.0
MAX_DUR = 8.0

# (regex appliqué sur le texte de la scène en minuscules, catégorie de diagramme)
KEYWORD_CATEGORY = [
    (r"\b(fissure\w*|craquel\w*|lézarde\w*|crack\w*)\b", "crack"),
    (r"\b(s.?enfonce\w*|s.?affaiss\w*|affaissement\w*|tassement\w*|sink\w*|settl\w*|subsid\w*)\b", "settlement"),
    (r"\b(semelle\w*|fondation\w*|foundation\w*|footing\w*)\b", "foundation"),
    (r"\b(b[ée]ton arm[ée]\w*|ferraillage\w*|armature\w*|reinforced concrete|rebar)\b", "concrete"),
    (r"\b(forage\w*|sondage\w*|geotechnical drilling|soil boring|essai de sol)\b", "drilling"),
    (r"\b(argile\w*|clay soil|sol argileux|expansive soil|sol gonflant)\b", "clay"),
    (r"\b(eau|infiltration\w*|humidit[ée]\w*|nappe phr[ée]atique|groundwater|water infiltration)\b", "water"),
    (r"\b(effondr\w*|collapse\w*|s.?[ée]croul\w*|ruine\w*)\b", "collapse"),
    (r"\b(ing[ée]nieur\w*|expert\w*|structural engineer|geotechnical engineer|inspect\w*)\b", "engineer"),
    (r"\b(plan\w*|sch[ée]ma\w*|blueprint\w*|diagram\w*)\b", "blueprint"),
    (r"\b(chantier\w*|excavat\w*|terrassement\w*|construction site)\b", "excavation"),
    (r"\b(pieu\w*|pile driving|fondation profonde|deep foundation)\b", "pile"),
    (r"\b(mur de sout[èe]nement|retaining wall)\b", "retaining_wall"),
    (r"\b(norme\w*|r[ée]glementation\w*|code du b[âa]timent|building code|dtu)\b", "code"),
]

FALLBACK_CATEGORY_CYCLE = ["settlement", "crack", "clay", "drilling",
                           "concrete", "foundation", "engineer", "site"]

CATEGORY_HEADER = {
    "crack": ("FISSURE STRUCTURELLE", "coupe A-A"),
    "settlement": ("AFFAISSEMENT DU SOL", "élévation"),
    "foundation": ("SEMELLE DE FONDATION", "éch. 1/50"),
    "concrete": ("BÉTON ARMÉ", "coupe armatures"),
    "drilling": ("SONDAGE GÉOTECHNIQUE", "essai pressiométrique"),
    "clay": ("NATURE DU SOL", "coupe stratigraphique"),
    "water": ("INFILTRATION D'EAU", "nappe phréatique"),
    "collapse": ("RUPTURE STRUCTURELLE", "état des lieux"),
    "engineer": ("DIAGNOSTIC STRUCTUREL", "inspection visuelle"),
    "blueprint": ("ÉTUDE TECHNIQUE", "cartouche de plan"),
    "site": ("PLAN DE SITUATION", "éch. 1/2000"),
    "code": ("NORMES EN VIGUEUR", "DTU 13.12"),
    "excavation": ("FOUILLE DE TERRASSEMENT", "coupe B-B"),
    "pile": ("FONDATIONS PROFONDES", "pieux forés"),
    "retaining_wall": ("MUR DE SOUTÈNEMENT", "poussée des terres"),
}


def flatten_words(segments):
    words = []
    for seg in segments:
        seg_words = seg.get("words") or []
        if seg_words:
            for w in seg_words:
                words.append({"word": w["word"], "start": w["start"], "end": w["end"]})
        else:
            words.append({"word": " " + seg["text"].strip(), "start": seg["start"], "end": seg["end"]})
    return words


def split_into_scenes(words):
    scenes = []
    cur = []
    cur_start = None
    sentence_end_re = re.compile(r'[.!?…][\'")\]]?$')

    for i, w in enumerate(words):
        if cur_start is None:
            cur_start = w["start"]
        cur.append(w)
        dur = w["end"] - cur_start
        is_last = i == len(words) - 1
        ends_sentence = bool(sentence_end_re.search(w["word"].strip()))

        cut = is_last or dur >= MAX_DUR or (dur >= MIN_DUR and ends_sentence)
        if cut:
            text = "".join(x["word"] for x in cur).strip()
            scenes.append({"start": cur_start, "end": w["end"], "text": text})
            cur = []
            cur_start = None

    if len(scenes) >= 2 and (scenes[-1]["end"] - scenes[-1]["start"]) < MIN_DUR:
        last = scenes.pop()
        scenes[-1]["end"] = last["end"]
        scenes[-1]["text"] = (scenes[-1]["text"] + " " + last["text"]).strip()

    return scenes


def detect_category(text, fallback_index):
    lowered = text.lower()
    for pattern, category in KEYWORD_CATEGORY:
        if re.search(pattern, lowered, flags=re.IGNORECASE):
            return category, True
    return FALLBACK_CATEGORY_CYCLE[fallback_index % len(FALLBACK_CATEGORY_CYCLE)], False


def main():
    transcript_path = os.path.join(OUTPUT_DIR, "transcript.json")
    with open(transcript_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    words = flatten_words(data["segments"])
    if not words:
        raise SystemExit("Aucun mot trouvé dans la transcription.")

    raw_scenes = split_into_scenes(words)

    scenes = []
    fallback_index = 0
    panel_number = 0
    prev_category = None
    for i, s in enumerate(raw_scenes):
        category, matched = detect_category(s["text"], fallback_index)
        if not matched:
            fallback_index += 1
        if category != prev_category:
            panel_number += 1
            prev_category = category
        title, subtitle = CATEGORY_HEADER.get(category, ("GÉNIE CIVIL", ""))
        scenes.append({
            "index": i,
            "start": round(s["start"], 3),
            "end": round(s["end"], 3),
            "duration": round(s["end"] - s["start"], 3),
            "text": s["text"],
            "category": category,
            "panel": panel_number,
            "title": title,
            "subtitle": subtitle,
        })

    total_panels = panel_number
    for s in scenes:
        s["total_panels"] = total_panels

    out_path = os.path.join(OUTPUT_DIR, "scenes.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(scenes, f, ensure_ascii=False, indent=2)

    durations = [s["duration"] for s in scenes]
    print(f"{len(scenes)} scènes générées en {total_panels} panneaux "
          f"(durée min={min(durations):.1f}s, max={max(durations):.1f}s, "
          f"moyenne={sum(durations)/len(durations):.1f}s)")
    print(f"-> {out_path}")


if __name__ == "__main__":
    main()
