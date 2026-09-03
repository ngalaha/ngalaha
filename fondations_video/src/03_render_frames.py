"""
Etape 3 : Rendu de l'animation (diagrammes techniques qui se dessinent,
titre qui s'écrit, légende qui apparaît ligne par ligne au fil de la voix).

Pour chaque panneau (un sujet/diagramme tenu sur une ou plusieurs scènes) :
  - les ~1ère seconde : le titre s'écrit lettre par lettre pendant que le
    diagramme se construit (catégories "animées" : la fissure se trace, le
    bâtiment bascule, les semelles apparaissent une à une... — pour les
    autres catégories, un fondu d'apparition générique) ;
  - pour chaque scène du panneau : les lignes de la légende apparaissent
    une à une, exactement quand le mot correspondant est prononcé (calé sur
    les timestamps Whisper).

100% local, aucun réseau requis. Chaque état distinct est une image PNG ;
04_build_video.py les assemble avec les durées exactes via le démuxeur
concat de FFmpeg (pas de ré-encodage intermédiaire par image).

Usage:
    python3 src/03_render_frames.py

Entrée:
    output/scenes.json
Sortie:
    output/frames/panel_NNN_fMMM.png
    output/scenes.json mis à jour avec panels[i]["frames"] = [{image, duration}, ...]
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw

import style as S
import diagrams as D

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "output")
FRAMES_DIR = os.path.join(OUTPUT_DIR, "frames")

DIAGRAM_BOX = (S.MARGIN, 340, S.W - S.MARGIN, 1560)
DRAWIN_WINDOW = 1.0     # durée de la construction du diagramme / du titre
N_DRAWIN_SAMPLES = 20   # nombre d'images pendant cette fenêtre
TITLE_WINDOW_FRAC = 0.6  # le titre finit de s'écrire à 60% de DRAWIN_WINDOW
FADE_DUR = 0.45         # fondu d'apparition pour les diagrammes non animés


def alpha_scaled(layer, alpha):
    if alpha >= 0.999:
        return layer
    a = layer.getchannel("A").point(lambda v: int(v * alpha))
    out = layer.copy()
    out.putalpha(a)
    return out


def compute_breakpoints(panel, panel_scenes, measure_draw):
    """Retourne (liste_de_temps_triée (relatifs au début du panneau),
    scene_line_data) où scene_line_data décrit, pour chaque scène, ses
    lignes de légende et l'instant (relatif) où chacune apparaît."""
    panel_start = panel["start"]
    panel_duration = panel["duration"]
    breakpoints = {0.0}

    drawin_window = min(DRAWIN_WINDOW, panel_duration * 0.6)
    for k in range(1, N_DRAWIN_SAMPLES + 1):
        t = drawin_window * k / N_DRAWIN_SAMPLES
        if t < panel_duration:
            breakpoints.add(round(t, 4))

    scene_line_data = []
    for scene in panel_scenes:
        rel_start = round(scene["start"] - panel_start, 4)
        rel_end = round(scene["end"] - panel_start, 4)
        breakpoints.add(rel_start)
        raw_lines = S.wrap_caption_with_starts(measure_draw, scene["words"]) if scene["words"] else \
            [(line, rel_start + panel_start) for line in S.wrap_caption(measure_draw, scene["text"])]
        line_entries = []
        for (text, abs_t) in raw_lines:
            rel_t = max(rel_start, round(abs_t - panel_start, 4))
            rel_t = min(rel_t, rel_end)
            breakpoints.add(rel_t)
            line_entries.append((text, rel_t))
        scene_line_data.append({
            "scene": scene, "rel_start": rel_start, "rel_end": rel_end, "lines": line_entries,
        })

    ordered = sorted(b for b in breakpoints if b < panel_duration)
    if not ordered or ordered[0] > 0.0:
        ordered = [0.0] + ordered
    return ordered, scene_line_data, drawin_window


def active_scene_data(scene_line_data, t):
    for sd in scene_line_data:
        if sd["rel_start"] <= t < sd["rel_end"]:
            return sd
    return scene_line_data[-1]


def render_panel(panel, panel_scenes, panel_index):
    accent = tuple(panel["accent"])
    category = panel["category"]
    fn, _, is_animated = D.resolve_diagram(category, panel["panel"])
    seed = panel["panel"]

    measure_img = Image.new("RGB", (S.W, S.H), S.BG)
    measure_draw = ImageDraw.Draw(measure_img)

    breakpoints, scene_line_data, drawin_window = compute_breakpoints(panel, panel_scenes, measure_draw)

    static_diagram_layer = None
    if not is_animated:
        static_diagram_layer = Image.new("RGBA", (S.W, S.H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(static_diagram_layer)
        fn(static_diagram_layer, ld, DIAGRAM_BOX, seed=seed, progress=1.0, accent=accent)

    total_panels = panel["total_panels"] if "total_panels" in panel else None

    frames = []
    n = len(breakpoints)
    for i, t in enumerate(breakpoints):
        next_t = breakpoints[i + 1] if i + 1 < n else panel["duration"]
        duration = round(next_t - t, 4)
        if duration <= 0:
            continue

        img = S.new_frame()
        draw = ImageDraw.Draw(img)

        title_progress = 1.0 if drawin_window <= 0 else min(1.0, t / (drawin_window * TITLE_WINDOW_FRAC))
        S.header(draw, panel["panel"], panel["title"], panel.get("subtitle"),
                  title_progress=title_progress, accent=accent)

        if is_animated:
            diagram_progress = 1.0 if drawin_window <= 0 else min(1.0, t / drawin_window)
            fn(img, draw, DIAGRAM_BOX, seed=seed, progress=diagram_progress, accent=accent)
        else:
            fade_alpha = 1.0 if FADE_DUR <= 0 else min(1.0, t / FADE_DUR)
            layer = alpha_scaled(static_diagram_layer, fade_alpha)
            img = img.convert("RGBA")
            img.alpha_composite(layer)
            img = img.convert("RGB")

        draw = ImageDraw.Draw(img)
        sd = active_scene_data(scene_line_data, t)
        lines_shown = sum(1 for (_, line_t) in sd["lines"] if line_t <= t + 1e-6)
        line_texts = [text for (text, _) in sd["lines"]]
        S.footer_caption(draw, line_texts, lines_shown, accent=accent)
        S.footer_chrome(draw, page=panel["panel"], total=panel["total_panels"], accent=accent)

        filename = f"panel_{panel['panel']:03d}_f{i:04d}.png"
        dest_path = os.path.join(FRAMES_DIR, filename)
        img.save(dest_path)
        frames.append({"image": os.path.join("frames", filename), "duration": duration})

    return frames


def main():
    with open(os.path.join(OUTPUT_DIR, "scenes.json"), "r", encoding="utf-8") as f:
        data = json.load(f)
    scenes = data["scenes"]
    panels = data["panels"]
    total_panels = data["total_panels"]
    scenes_by_index = {s["index"]: s for s in scenes}

    os.makedirs(FRAMES_DIR, exist_ok=True)

    for i, panel in enumerate(panels):
        panel_scenes = [scenes_by_index[idx] for idx in panel["scene_indices"]]
        panel["total_panels"] = total_panels
        print(f"[{i+1}/{len(panels)}] panneau {panel['panel']:02d} "
              f"({panel['category']}, {panel['duration']:.1f}s, {len(panel_scenes)} scène(s))...", end=" ")
        frames = render_panel(panel, panel_scenes, i)
        panel["frames"] = frames
        print(f"{len(frames)} images")

    with open(os.path.join(OUTPUT_DIR, "scenes.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    total_frames = sum(len(p["frames"]) for p in panels)
    print(f"\n{total_frames} images générées dans {FRAMES_DIR}")


if __name__ == "__main__":
    main()
