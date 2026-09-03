"""
Etape 3 : Rendu des images (diagrammes techniques style plan d'architecte).

100% local, aucun réseau requis (contrairement à l'ancienne approche par
génération d'images IA) : plus rapide et plus fiable, en particulier sur
téléphone.

Le diagramme (seed = numéro de panneau) reste visuellement identique pour
toutes les scènes d'un même panneau : à l'étape 4, la caméra zoome en
continu sur ce panneau sans à-coup pendant que la légende change au fil de
la voix off, comme un seul plan tenu.

Usage:
    python3 src/03_render_frames.py

Entrée:
    output/scenes.json
Sortie:
    output/frames/scene_000.png, scene_001.png, ...
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import ImageDraw

import style as S
import diagrams as D

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "output")
FRAMES_DIR = os.path.join(OUTPUT_DIR, "frames")

DIAGRAM_BOX = (S.MARGIN, 340, S.W - S.MARGIN, 1560)


def main():
    with open(os.path.join(OUTPUT_DIR, "scenes.json"), "r", encoding="utf-8") as f:
        data = json.load(f)
    scenes = data["scenes"]
    total_panels = data["total_panels"]

    os.makedirs(FRAMES_DIR, exist_ok=True)

    for i, scene in enumerate(scenes):
        filename = f"scene_{scene['index']:03d}.png"
        dest_path = os.path.join(FRAMES_DIR, filename)
        scene["image"] = os.path.join("frames", filename)

        img = S.new_frame()
        draw = ImageDraw.Draw(img)
        S.header(draw, scene["panel"], scene["title"], scene.get("subtitle"))
        D.draw_category(img, draw, DIAGRAM_BOX, scene["category"], seed=scene["panel"],
                         fallback_index=scene["panel"])
        draw = ImageDraw.Draw(img)
        S.footer(draw, scene["text"], page=scene["panel"], total=total_panels)

        img.save(dest_path)
        print(f"[{i+1}/{len(scenes)}] {filename}  ({scene['category']}, panneau {scene['panel']})")

    with open(os.path.join(OUTPUT_DIR, "scenes.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n{len(scenes)} images générées dans {FRAMES_DIR}")


if __name__ == "__main__":
    main()
