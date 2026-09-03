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

# (titre, sous-titre, couleur d'accent RGB — une teinte vive par catégorie)
CATEGORY_HEADER = {
    "crack": ("FISSURE STRUCTURELLE", "coupe A-A", (216, 40, 45)),
    "settlement": ("AFFAISSEMENT DU SOL", "élévation", (245, 130, 32)),
    "foundation": ("SEMELLE DE FONDATION", "éch. 1/50", (25, 110, 210)),
    "concrete": ("BÉTON ARMÉ", "coupe armatures", (0, 137, 123)),
    "drilling": ("SONDAGE GÉOTECHNIQUE", "essai pressiométrique", (160, 100, 40)),
    "clay": ("NATURE DU SOL", "coupe stratigraphique", (200, 130, 20)),
    "water": ("INFILTRATION D'EAU", "nappe phréatique", (0, 150, 190)),
    "collapse": ("RUPTURE STRUCTURELLE", "état des lieux", (190, 20, 30)),
    "engineer": ("DIAGNOSTIC STRUCTUREL", "inspection visuelle", (140, 30, 170)),
    "blueprint": ("ÉTUDE TECHNIQUE", "cartouche de plan", (55, 65, 175)),
    "site": ("PLAN DE SITUATION", "éch. 1/2000", (55, 155, 60)),
    "code": ("NORMES EN VIGUEUR", "DTU 13.12", (55, 65, 175)),
    "excavation": ("FOUILLE DE TERRASSEMENT", "coupe B-B", (120, 80, 45)),
    "pile": ("FONDATIONS PROFONDES", "pieux forés", (0, 130, 145)),
    "retaining_wall": ("MUR DE SOUTÈNEMENT", "poussée des terres", (210, 75, 20)),
}
DEFAULT_ACCENT = (139, 30, 42)


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
            scenes.append({"start": cur_start, "end": w["end"], "text": text, "words": list(cur)})
            cur = []
            cur_start = None

    if len(scenes) >= 2 and (scenes[-1]["end"] - scenes[-1]["start"]) < MIN_DUR:
        last = scenes.pop()
        scenes[-1]["end"] = last["end"]
        scenes[-1]["text"] = (scenes[-1]["text"] + " " + last["text"]).strip()
        scenes[-1]["words"] = scenes[-1]["words"] + last["words"]

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

    # Chaîne chaque scène jusqu'au début exact de la suivante : les silences
    # entre segments de parole ne sont ainsi pas "perdus" (ce qui ferait
    # dériver la vidéo en avance sur la voix off). La première scène démarre
    # à 0 pour éviter une image noire avant le premier mot ; la fin de la
    # toute dernière scène est ajustée sur la durée audio par 04_build_video.py.
    if raw_scenes:
        raw_scenes[0]["start"] = 0.0
        for i in range(len(raw_scenes) - 1):
            raw_scenes[i]["end"] = raw_scenes[i + 1]["start"]

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
        title, subtitle, accent = CATEGORY_HEADER.get(category, ("GÉNIE CIVIL", "", DEFAULT_ACCENT))
        scenes.append({
            "index": i,
            "start": round(s["start"], 3),
            "end": round(s["end"], 3),
            "duration": round(s["end"] - s["start"], 3),
            "text": s["text"],
            "words": [{"word": w["word"], "start": round(w["start"], 3), "end": round(w["end"], 3)}
                      for w in s["words"]],
            "category": category,
            "panel": panel_number,
            "title": title,
            "subtitle": subtitle,
            "accent": list(accent),
        })

    total_panels = panel_number
    for s in scenes:
        s["total_panels"] = total_panels

    panels = []
    for s in scenes:
        if not panels or panels[-1]["panel"] != s["panel"]:
            panels.append({
                "panel": s["panel"],
                "category": s["category"],
                "title": s["title"],
                "subtitle": s["subtitle"],
                "accent": s["accent"],
                "start": s["start"],
                "end": s["end"],
                "scene_indices": [s["index"]],
            })
        else:
            panels[-1]["end"] = s["end"]
            panels[-1]["scene_indices"].append(s["index"])
    for p in panels:
        p["duration"] = round(p["end"] - p["start"], 3)

    out_path = os.path.join(OUTPUT_DIR, "scenes.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"scenes": scenes, "panels": panels, "total_panels": total_panels},
                   f, ensure_ascii=False, indent=2)

    durations = [s["duration"] for s in scenes]
    panel_durations = [p["duration"] for p in panels]
    print(f"{len(scenes)} scènes générées en {total_panels} panneaux "
          f"(durée scène min={min(durations):.1f}s, max={max(durations):.1f}s ; "
          f"durée panneau min={min(panel_durations):.1f}s, max={max(panel_durations):.1f}s)")
    print(f"-> {out_path}")


if __name__ == "__main__":
    main()
