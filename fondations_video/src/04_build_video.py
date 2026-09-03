"""
Etape 4 : Montage & assemblage (FFmpeg) — assemble la séquence d'images
animées de chaque panneau (produite par 03_render_frames.py) en un plan
continu avec zoom discret, puis enchaîne les panneaux en fondu croisé,
calé au frame près sur la voix off d'origine.

Pour chaque panneau :
  a) ses images (déjà animées : diagramme qui se construit, légende qui
     apparaît ligne par ligne) sont assemblées en un flux vidéo continu via
     le démuxeur concat de FFmpeg, chaque image tenue exactement sa durée ;
  b) un zoom discret et continu (aucune remise à zéro) est appliqué sur ce
     plan entier.
Les panneaux sont ensuite enchaînés avec un fondu croisé (transition de
0,4s) au lieu d'une coupe franche — chaque panneau (sauf le dernier) porte
une queue supplémentaire de cette durée, consommée par le fondu suivant,
pour que la durée totale reste calée à la frame près sur la piste audio
d'origine, ajoutée en dernière étape.

Usage:
    python3 src/04_build_video.py [--output erreur_fatale_fondations.mp4]

Entrées:
    output/scenes.json  (panels[i]["frames"], produit par 03_render_frames.py)
    input/audio.mp3
Sortie:
    erreur_fatale_fondations.mp4 (à la racine du projet)
"""
import argparse
import copy
import json
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "output")
PANELS_DIR = os.path.join(OUTPUT_DIR, "panels")
AUDIO_PATH = os.path.join(ROOT, "input", "audio.mp3")

FPS = 30
WIDTH, HEIGHT = 1080, 1920
UPSCALE_W, UPSCALE_H = 2160, 3840  # zoompan sur une image plus grande = zoom plus fluide
TRANSITION_DUR = 0.4  # fondu enchaîné entre panneaux
MIN_ZOOM_TARGET = 1.03
MAX_ZOOM_TARGET = 1.20
ZOOM_RATE_PER_SEC = 0.012  # vitesse de zoom, adaptée à la durée du panneau


def run(cmd):
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print("Commande ffmpeg échouée:")
        print(" ".join(cmd))
        print(result.stderr[-3000:])
        raise SystemExit(1)
    return result


def ffprobe_duration(path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )
    return float(result.stdout.strip())


def write_concat_list(frames, list_path):
    with open(list_path, "w", encoding="utf-8") as f:
        for fr in frames:
            image_path = os.path.join(OUTPUT_DIR, fr["image"])
            f.write(f"file '{image_path}'\n")
            f.write(f"duration {max(fr['duration'], 0.01):.4f}\n")
        # Contourne le comportement du démuxeur concat qui ignore la durée
        # de la toute dernière entrée : on répète la dernière image.
        last_image = os.path.join(OUTPUT_DIR, frames[-1]["image"])
        f.write(f"file '{last_image}'\n")


def zoom_panel(raw_frames, total_duration, out_path, work_dir, panel_num):
    # zoompan doit recevoir un flux vidéo continu (il consomme un frame
    # d'entrée par frame de sortie quand d=1) : lui donner directement le
    # démuxeur concat le fait s'arrêter après seulement quelques images,
    # une par entrée de la liste, en ignorant leur durée. On assemble donc
    # d'abord un vrai flux vidéo à durée exacte (sans zoom), puis on
    # applique le zoom dans une seconde passe sur ce flux.
    concat_list_path = os.path.join(work_dir, f"panel_{panel_num:03d}_frames.txt")
    write_concat_list(raw_frames, concat_list_path)

    raw_path = os.path.join(work_dir, f"panel_{panel_num:03d}_raw.mp4")
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", concat_list_path,
        "-r", str(FPS), "-pix_fmt", "yuv420p",
        raw_path,
    ])

    frames_count = max(1, round(total_duration * FPS))
    target_zoom = min(MAX_ZOOM_TARGET, max(MIN_ZOOM_TARGET, 1.0 + total_duration * ZOOM_RATE_PER_SEC))
    increment = (target_zoom - 1) / frames_count

    zoom_expr = f"min(zoom+{increment:.8f},{target_zoom:.5f})"
    vf = (
        f"scale={UPSCALE_W}:{UPSCALE_H}:force_original_aspect_ratio=increase,"
        f"crop={UPSCALE_W}:{UPSCALE_H},"
        f"zoompan=z='{zoom_expr}':d=1:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':s={WIDTH}x{HEIGHT}:fps={FPS},"
        f"format=yuv420p"
    )
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", raw_path,
        "-vf", vf,
        "-frames:v", str(frames_count),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        out_path,
    ]
    run(cmd)


def build_panel_clip(panel, pad_tail, work_dir):
    frames = copy.deepcopy(panel["frames"])
    frames[-1]["duration"] = round(frames[-1]["duration"] + pad_tail, 4)
    total_duration = panel["duration"] + pad_tail

    out_path = os.path.join(work_dir, f"panel_{panel['panel']:03d}.mp4")
    zoom_panel(frames, total_duration, out_path, work_dir, panel["panel"])
    return out_path


def xfade_chain(clip_paths, content_durations, transition_dur, out_path):
    if len(clip_paths) == 1:
        shutil.copyfile(clip_paths[0], out_path)
        return

    inputs = []
    for p in clip_paths:
        inputs += ["-i", p]

    # Chaque clip (sauf le dernier) a été encodé avec une queue supplémentaire
    # de `transition_dur` (voir pad_tail dans build_panel_clip). L'offset du
    # fondu se place exactement à la fin du contenu "utile" déjà accumulé
    # (sans jamais soustraire transition_dur) : le fondu consomme uniquement
    # la queue de rembourrage, donc la durée de contenu réel n'est jamais
    # raccourcie, à aucune étape de la chaîne.
    filter_parts = []
    running_label = "0:v"
    cumulative = content_durations[0]
    last_k = len(clip_paths) - 1
    for k in range(1, len(clip_paths)):
        out_label = f"v{k}" if k < last_k else "vout"
        offset = max(cumulative, 0.01)
        filter_parts.append(
            f"[{running_label}][{k}:v]xfade=transition=fade:duration={transition_dur}:"
            f"offset={offset:.3f}[{out_label}]"
        )
        running_label = out_label
        cumulative += content_durations[k]

    filter_complex = ";".join(filter_parts)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        out_path,
    ]
    run(cmd)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=os.path.join(ROOT, "erreur_fatale_fondations.mp4"))
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        print("ffmpeg/ffprobe introuvable. Installez-le (ex: 'sudo apt-get install ffmpeg').")
        sys.exit(1)

    with open(os.path.join(OUTPUT_DIR, "scenes.json"), "r", encoding="utf-8") as f:
        data = json.load(f)
    panels = data["panels"]

    missing = [p for p in panels if not p.get("frames")]
    if missing:
        print(f"{len(missing)} panneau(x) sans images. Lancez d'abord 03_render_frames.py.")
        sys.exit(1)

    if not os.path.isfile(AUDIO_PATH):
        print(f"Audio introuvable: {AUDIO_PATH}")
        sys.exit(1)

    audio_duration = ffprobe_duration(AUDIO_PATH)
    panels_end = panels[-1]["end"]
    if audio_duration > panels_end:
        extra = round(audio_duration - panels_end, 3)
        panels[-1]["duration"] = round(panels[-1]["duration"] + extra, 3)
        panels[-1]["frames"][-1]["duration"] = round(panels[-1]["frames"][-1]["duration"] + extra, 3)

    os.makedirs(PANELS_DIR, exist_ok=True)

    print(f"Construction de {len(panels)} panneaux (plans continus animés, zoom sans à-coup)...")
    clip_paths = []
    content_durations = []
    for i, panel in enumerate(panels):
        pad_tail = TRANSITION_DUR if i < len(panels) - 1 else 0.0
        n_scenes = len(panel["scene_indices"])
        print(f"  [{i+1}/{len(panels)}] panneau {panel['panel']:02d} "
              f"({panel['category']}, {panel['duration']:.1f}s, {n_scenes} scène(s), "
              f"{len(panel['frames'])} images)")
        clip_path = build_panel_clip(panel, pad_tail, PANELS_DIR)
        clip_paths.append(clip_path)
        content_durations.append(panel["duration"])

    print("Enchaînement des panneaux (fondu croisé)...")
    silent_video_path = os.path.join(OUTPUT_DIR, "video_silent.mp4")
    xfade_chain(clip_paths, content_durations, TRANSITION_DUR, silent_video_path)

    final_output = args.output
    print("Ajout de la piste audio d'origine...")
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", silent_video_path, "-i", AUDIO_PATH,
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        final_output,
    ])

    print(f"\nVidéo finale générée: {final_output}")


if __name__ == "__main__":
    main()
