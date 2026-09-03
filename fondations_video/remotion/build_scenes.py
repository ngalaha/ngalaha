import json

with open("aligned_sentences.json", encoding="utf-8") as f:
    S = json.load(f)

TOTAL = 228.937125


def span(a, b):
    """start of sentence a, end of sentence b (inclusive), 0-indexed."""
    return round(S[a]["start"], 3), round(S[b]["end"], 3)


def texts(a, b):
    return [S[i]["text"] for i in range(a, b + 1)]


def cue_times(a, b):
    return [{"text": S[i]["text"], "start": round(S[i]["start"], 3), "end": round(S[i]["end"], 3)}
            for i in range(a, b + 1)]


scenes = []


def add(type_, a, b, **content):
    start, end = span(a, b)
    scenes.append({
        "type": type_,
        "start": start,
        "end": end,
        "cues": cue_times(a, b),
        **content,
    })


add("building", 0, 2, mode="sink", accent="danger",
    big=None)
add("building", 3, 4, mode="crack", accent="danger")
add("building", 5, 6, mode="collapse", accent="danger")
add("statement", 7, 8, accent="warning", big="Les fondations ont été\nmal calculées.")
add("titlecard", 9, 9, eyebrow="ERREUR FATALE #1", title="LES FONDATIONS")
add("building", 10, 11, mode="cutaway", accent="blue")
add("checklist", 12, 12, accent="blue", title="Une bonne fondation doit :", items=[
    {"icon": "scale", "text": "Distribuer le poids uniformément"},
    {"icon": "layers", "text": "S'adapter à la nature du sol"},
    {"icon": "arrows", "text": "Résister aux forces verticales et horizontales"},
    {"icon": "clock", "text": "Durer des décennies sans bouger"},
])
add("checklist", 13, 16, accent="warning", title="Une fondation mal calculée, c'est souvent :", items=[
    {"icon": "magnifier", "text": "Pas d'étude géotechnique sérieuse"},
    {"icon": "soil", "text": "Qualité du sol mal connue"},
    {"icon": "weight", "text": "Poids total sous-estimé"},
    {"icon": "wind", "text": "Vent, séismes, eaux souterraines oubliés"},
])
add("building", 17, 20, mode="sink_slow", accent="warning")
add("building", 21, 23, mode="crack_form", accent="danger")
add("checklist", 24, 28, accent="danger", title="Les dégâts s'accumulent :", items=[
    {"icon": "warning", "text": "Affaissement différentiel"},
    {"icon": "door", "text": "Portes qui bloquent"},
    {"icon": "window", "text": "Fenêtres qui cassent"},
    {"icon": "pipe", "text": "Tuyauteries fissurées"},
])
add("building", 29, 34, mode="rebar", accent="danger")
add("stats", 35, 38, accent="danger", title="Un problème mondial",
    stats=[
        {"value": "100+", "label": "bâtiments touchés\n(France, Canada...)"},
        {"value": "Millions", "label": "d'euros de réparations\ncumulées"},
    ])
add("statement", 39, 40, accent="warning", big="Beaucoup auraient pu être évités\navec un simple document.")
add("titlecard", 41, 41, eyebrow="LA SOLUTION", title="VOILÀ CE QU'IL FAUT FAIRE")
add("checklist", 42, 44, accent="blue", title="1. L'étude géotechnique", items=[
    {"icon": "drill", "text": "Forages et analyses du sol"},
    {"icon": "check", "text": "Test de portance"},
    {"icon": "coin", "text": "L'investissement le plus rentable"},
])
add("ruler", 45, 47, accent="blue", title="2. La profondeur",
    marks=["1 m", "3 m", "plus"])
add("checklist", 48, 50, accent="blue", title="3. Semelles et radiers", items=[
    {"icon": "footing", "text": "C'est là que les forces se distribuent"},
    {"icon": "cross", "text": "Pas de raccourcis"},
])
add("checklist", 51, 53, accent="blue", title="4. Risques géologiques locaux", items=[
    {"icon": "water", "text": "Nappes phréatiques"},
    {"icon": "soil", "text": "Argiles gonflantes"},
    {"icon": "cave", "text": "Terrains karstiques"},
])
add("statement", 54, 54, accent="blue", big="Les fondations, c'est l'invisible\nqui porte tout.")
add("cost", 55, 56, accent="blue",
    a_label="Étude géotechnique", a_value=8, a_text="5 000 – 10 000 €",
    b_label="Réparations évitées", b_value=100, b_text="100 000 €")
add("statement", 57, 58, accent="blue", big="Des fondations bien calculées :\nla base des bâtiments qui durent.")
add("building", 59, 61, mode="underground", accent="blue")
add("outro", 62, 65, accent="warning")

durations = [round(s["end"] - s["start"], 2) for s in scenes]
print(f"{len(scenes)} scenes, total={scenes[-1]['end']:.2f}s (attendu {TOTAL:.2f}s)")
for s, d in zip(scenes, durations):
    print(f"  [{s['start']:6.2f}-{s['end']:6.2f}] ({d:5.2f}s) {s['type']}")

with open("src/scenes.json", "w", encoding="utf-8") as f:
    json.dump({"totalDuration": TOTAL, "scenes": scenes}, f, ensure_ascii=False, indent=2)
