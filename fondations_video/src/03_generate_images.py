"""
Etape 3 : Génération d'images HD gratuites via l'API Pollinations.ai
(aucune clé API requise).

Usage:
    python3 src/03_generate_images.py

Entrée:
    output/scenes.json
Sortie:
    output/images/scene_000.jpg, scene_001.jpg, ...
    (le chemin de l'image est aussi ajouté à chaque scène dans scenes.json)
"""
import json
import os
import time
import urllib.parse

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "output")
IMAGES_DIR = os.path.join(OUTPUT_DIR, "images")

BASE_URL = "https://image.pollinations.ai/prompt/"
WIDTH = 1920
HEIGHT = 1080
MODEL = "flux"
MAX_RETRIES = 5
TIMEOUT = 120
# Pollinations est un service gratuit partagé : on espace les requêtes pour
# rester correct vis-à-vis du service et limiter les 429/erreurs.
DELAY_BETWEEN_REQUESTS = 3


def build_url(prompt: str, seed: int) -> str:
    encoded = urllib.parse.quote(prompt, safe="")
    return (
        f"{BASE_URL}{encoded}"
        f"?width={WIDTH}&height={HEIGHT}&nologo=true&model={MODEL}&seed={seed}"
    )


def download_image(prompt: str, dest_path: str, seed: int) -> bool:
    url = build_url(prompt, seed)
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, timeout=TIMEOUT)
            if resp.status_code == 200 and resp.content:
                with open(dest_path, "wb") as f:
                    f.write(resp.content)
                return True
            print(f"    tentative {attempt}: HTTP {resp.status_code}, nouvel essai...")
        except requests.RequestException as e:
            print(f"    tentative {attempt}: erreur réseau ({e}), nouvel essai...")
        time.sleep(min(5 * attempt, 30))
    return False


def main():
    scenes_path = os.path.join(OUTPUT_DIR, "scenes.json")
    with open(scenes_path, "r", encoding="utf-8") as f:
        scenes = json.load(f)

    os.makedirs(IMAGES_DIR, exist_ok=True)

    for i, scene in enumerate(scenes):
        filename = f"scene_{scene['index']:03d}.jpg"
        dest_path = os.path.join(IMAGES_DIR, filename)
        scene["image"] = os.path.join("images", filename)

        if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
            print(f"[{i+1}/{len(scenes)}] déjà présent: {filename}")
            continue

        print(f"[{i+1}/{len(scenes)}] génération: {filename}")
        print(f"    prompt: {scene['prompt'][:100]}...")
        ok = download_image(scene["prompt"], dest_path, seed=scene["index"])
        if not ok:
            print(f"    ECHEC pour la scène {scene['index']} après {MAX_RETRIES} tentatives.")
        else:
            # sauvegarde incrémentale pour pouvoir reprendre en cas d'interruption
            with open(scenes_path, "w", encoding="utf-8") as f:
                json.dump(scenes, f, ensure_ascii=False, indent=2)
            time.sleep(DELAY_BETWEEN_REQUESTS)

    with open(scenes_path, "w", encoding="utf-8") as f:
        json.dump(scenes, f, ensure_ascii=False, indent=2)

    missing = [s for s in scenes if not os.path.isfile(os.path.join(OUTPUT_DIR, s["image"]))]
    if missing:
        print(f"\n{len(missing)} image(s) manquante(s). Relancez ce script pour reprendre "
              f"(les images déjà téléchargées ne sont pas re-générées).")
    else:
        print(f"\nToutes les {len(scenes)} images ont été générées dans {IMAGES_DIR}")


if __name__ == "__main__":
    main()
