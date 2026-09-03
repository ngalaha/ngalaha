"""
Etape 2 : Découpage en scènes visuelles (3-8s) + génération des prompts
anglais ultra-détaillés orientés génie civil / structures / fondations.

Usage:
    python3 src/02_scene_prompts.py

Entrée:
    output/transcript.json  (produit par 01_transcribe.py)
Sortie:
    output/scenes.json      (liste de scènes: start, end, duration, text, prompt)
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "output")

MIN_DUR = 3.0
MAX_DUR = 8.0

STYLE_SUFFIX = (
    ", photorealistic, cinematic dramatic lighting, ultra detailed, 8k, "
    "civil engineering documentary photography, shallow depth of field"
)

# (regex pattern applied on lowercased scene text, English visual prompt)
KEYWORD_MOTIFS = [
    (r"\b(fissure\w*|craquel\w*|lézarde\w*|crack\w*)\b",
     "extreme close-up of a deep diagonal structural crack splitting a reinforced "
     "concrete wall, crumbling plaster revealing exposed rusted rebar underneath, "
     "fine dust particles falling in a beam of raking light"),

    (r"\b(s.?enfonce\w*|s.?affaiss\w*|affaissement\w*|tassement\w*|sink\w*|settl\w*|subsid\w*)\b",
     "wide establishing shot of a multi-story apartment building visibly tilting "
     "and sinking into the ground at one corner, the facade cracked from roof to "
     "base, part of the foundation exposed and sunken into muddy soil, dramatic "
     "overcast sky"),

    (r"\b(semelle\w*|fondation\w*|foundation\w*|footing\w*)\b",
     "detailed technical cutaway cross-section of a concrete spread footing "
     "foundation underground, visible rebar cage, distinct soil strata of clay "
     "and sand, geotechnical engineering annotations, rendered as a hyper-"
     "realistic museum diorama"),

    (r"\b(b[ée]ton arm[ée]\w*|ferraillage\w*|armature\w*|reinforced concrete|rebar)\b",
     "extreme close-up macro shot of a reinforced concrete rebar cage during a "
     "concrete pour, wet grey concrete flowing around the steel bars, a "
     "construction worker using a vibrating poker, industrial construction site, "
     "natural daylight"),

    (r"\b(forage\w*|sondage\w*|geotechnical drilling|soil boring|essai de sol)\b",
     "geotechnical drilling rig performing a soil boring test on an active "
     "construction site, the drill rod penetrating deep into the ground, "
     "engineers in hard hats examining cylindrical soil samples in clear plastic "
     "tubes, overcast sky"),

    (r"\b(argile\w*|clay soil|sol argileux|expansive soil|sol gonflant)\b",
     "macro photograph of severely cracked, dry expansive clay soil with deep "
     "desiccation fissures forming a honeycomb pattern, the edge of a building "
     "foundation visible at the top of the frame, harsh directional sunlight"),

    (r"\b(eau|infiltration\w*|humidit[ée]\w*|nappe phr[ée]atique|groundwater|water infiltration)\b",
     "underground cutaway view of groundwater seeping into a building foundation "
     "trench, dark water pooling around concrete footings, wet saturated soil, "
     "dramatic cinematic side lighting"),

    (r"\b(effondr\w*|collapse\w*|s.?[ée]croul\w*|ruine\w*)\b",
     "dramatic wide shot of a partially collapsed multi-story building facade, "
     "broken concrete slabs and rubble scattered on the ground, twisted exposed "
     "steel reinforcement bars, a haze of dust in the air, disaster documentary "
     "style"),

    (r"\b(ing[ée]nieur\w*|expert\w*|structural engineer|geotechnical engineer|inspect\w*)\b",
     "a structural engineer wearing a hard hat and high-visibility safety vest "
     "inspecting a wide crack in a concrete foundation wall with a crack-width "
     "gauge, clipboard in hand, construction site in the background"),

    (r"\b(plan\w*|sch[ée]ma\w*|blueprint\w*|diagram\w*)\b",
     "a detailed architectural blueprint of a building's foundation plan spread "
     "out on a construction site table, engineering ruler and pencil resting on "
     "it, a hard hat beside the drawings, warm natural light"),

    (r"\b(chantier\w*|excavat\w*|terrassement\w*|construction site)\b",
     "a large excavator digging a deep foundation trench on an active "
     "construction site, exposed layered soil strata along the trench walls, "
     "safety barriers and workers in high-visibility vests, golden hour light"),

    (r"\b(pieu\w*|pile driving|fondation profonde|deep foundation)\b",
     "a pile driving rig hammering a long concrete pile deep into the ground on "
     "a construction site, visible vibration and dust, industrial crane in the "
     "background, overcast sky"),

    (r"\b(mur de sout[èe]nement|retaining wall)\b",
     "a large reinforced concrete retaining wall visibly bulging and cracking "
     "under soil pressure, clear structural deformation, yellow warning tape in "
     "front, engineering failure documentation photography"),

    (r"\b(norme\w*|r[ée]glementation\w*|code du b[âa]timent|building code|dtu)\b",
     "close-up of an engineering building-code reference book and technical "
     "standards documents on a desk next to structural calculation software on "
     "a laptop screen, foundation blueprints pinned on the wall behind"),
]

FALLBACK_ROTATION = [
    "wide cinematic establishing shot of a modern apartment building at dusk, "
    "one corner of the structure visibly leaning, ominous storm clouds gathering "
    "overhead",
    "close-up of a structural engineer's hand tracing a crack on a concrete "
    "foundation wall with a measuring tool, construction site blurred in the "
    "background",
    "technical cross-section illustration of layered soil strata beneath a "
    "building foundation, showing clay, sand and bedrock layers with "
    "geotechnical survey markers",
    "a geotechnical drilling rig extracting a soil core sample on a "
    "construction site under a grey overcast sky",
    "close-up of wet reinforced concrete being poured into foundation "
    "formwork, steel rebar cage visible, construction workers in the "
    "background",
    "dramatic low-angle shot of a building's foundation wall with a visible "
    "diagonal crack running through exposed brick and concrete",
    "an engineer reviewing detailed foundation blueprints and structural "
    "calculations on a tablet at a construction site",
    "wide shot of heavy excavation machinery digging a deep foundation "
    "trench, exposed soil layers, safety fencing around the site",
]


def flatten_words(segments):
    words = []
    for seg in segments:
        seg_words = seg.get("words") or []
        if seg_words:
            for w in seg_words:
                words.append({"word": w["word"], "start": w["start"], "end": w["end"]})
        else:
            # fallback if word-level timestamps are missing for this segment
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

    # fuse a too-short trailing scene into the previous one
    if len(scenes) >= 2 and (scenes[-1]["end"] - scenes[-1]["start"]) < MIN_DUR:
        last = scenes.pop()
        scenes[-1]["end"] = last["end"]
        scenes[-1]["text"] = (scenes[-1]["text"] + " " + last["text"]).strip()

    return scenes


def build_prompt(text, fallback_index):
    lowered = text.lower()
    matched = []
    for pattern, motif in KEYWORD_MOTIFS:
        if re.search(pattern, lowered, flags=re.IGNORECASE):
            matched.append(motif)
        if len(matched) >= 2:
            break

    if not matched:
        matched = [FALLBACK_ROTATION[fallback_index % len(FALLBACK_ROTATION)]]

    prompt = ", ".join(matched) + STYLE_SUFFIX
    return prompt


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
    for i, s in enumerate(raw_scenes):
        duration = round(s["end"] - s["start"], 3)
        text = s["text"]
        lowered = text.lower()
        has_keyword = any(re.search(p, lowered, flags=re.IGNORECASE) for p, _ in KEYWORD_MOTIFS)
        prompt = build_prompt(text, fallback_index)
        if not has_keyword:
            fallback_index += 1
        scenes.append({
            "index": i,
            "start": round(s["start"], 3),
            "end": round(s["end"], 3),
            "duration": duration,
            "text": text,
            "prompt": prompt,
        })

    out_path = os.path.join(OUTPUT_DIR, "scenes.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(scenes, f, ensure_ascii=False, indent=2)

    durations = [s["duration"] for s in scenes]
    print(f"{len(scenes)} scènes générées "
          f"(durée min={min(durations):.1f}s, max={max(durations):.1f}s, "
          f"moyenne={sum(durations)/len(durations):.1f}s)")
    print(f"-> {out_path}")


if __name__ == "__main__":
    main()
