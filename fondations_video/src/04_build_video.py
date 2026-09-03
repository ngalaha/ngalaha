"""
Etape 4 : Montage & assemblage (FFmpeg) — zoom continu par panneau et
transitions en fondu enchaîné, calés sur les timestamps réels de la voix
off.

Pour chaque panneau (un même sujet/diagramme tenu sur plusieurs scènes) :
  a) chaque scène est convertie en un court clip immobile de sa durée
     exacte (issue des timestamps Whisper) ;
  b) ces clips sont mis bout à bout SANS ré-encodage (même codec) pour
     obtenir un plan continu sur toute la durée du panneau — la légende
     change au fil du texte pendant que l'image reste la même ;
  c) un zoom discret et continu (aucune remise à zéro à chaque scène) est
     appliqué sur ce plan entier.
Les panneaux sont ensuite enchaînés avec un fondu croisé (transition
"professionnelle") au lieu d'une coupe franche, puis la piste audio
d'origine est ajoutée. La durée totale reste calée sur l'audio : chaque
panneau (sauf le dernier) porte une queue supplémentaire égale à la durée
de transition, consommée par le fondu suivant, pour que rien ne soit
raccourci.

Usage:
    python3 src/04_build_video.py [--output erreur_fatale_fondations.mp4]

Entrées:
    output/scenes.json  (scenes + panels, images générées par 03_render_frames.py)
    input/audio.mp3
Sortie:
    erreur_fatale_fondations.mp4 (à la racine du projet)
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "output")
SEGMENTS_DIR = os.path.join(OUTPUT_DIR, "segments")
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


def build_scene_segment(image_path, duration, out_path):
    frames = max(1, round(duration * FPS))
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-loop", "1", "-framerate", str(FPS), "-i", image_path,
        "-frames:v", str(frames),
        "-vf", "format=yuv420p",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-pix_fmt", "yuv420p",
        out_path,
    ]
    run(cmd)


def concat_segments(segment_paths, out_path):
    list_path = out_path + ".txt"
    with open(list_path, "w", encoding="utf-8") as f:
        for p in segment_paths:
            f.write(f"file '{p}'\n")
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", list_path,
        "-c", "copy", out_path,
    ])


def zoom_panel(raw_path, total_duration, out_path):
    frames = max(1, round(total_duration * FPS))
    target_zoom = min(MAX_ZOOM_TARGET, max(MIN_ZOOM_TARGET, 1.0 + total_duration * ZOOM_RATE_PER_SEC))
    increment = (target_zoom - 1) / frames

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
        "-frames:v", str(frames),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        out_path,
    ]
    run(cmd)


def build_panel_clip(panel, scenes_by_index, pad_tail, work_dir):
    idxs = panel["scene_indices"]
    segment_paths = []
    for j, idx in enumerate(idxs):
        scene = scenes_by_index[idx]
        dur = scene["duration"]
        if j == len(idxs) - 1:
            dur += pad_tail
        image_path = os.path.join(OUTPUT_DIR, scene["image"])
        seg_path = os.path.join(SEGMENTS_DIR, f"seg_{scene['index']:03d}.mp4")
        segment_paths.append(seg_path)
        if not os.path.isfile(seg_path):
            build_scene_segment(image_path, max(dur, 0.1), seg_path)

    raw_path = os.path.join(work_dir, f"panel_{panel['panel']:03d}_raw.mp4")
    concat_segments(segment_paths, raw_path)

    total_duration = panel["duration"] + pad_tail
    zoomed_path = os.path.join(work_dir, f"panel_{panel['panel']:03d}.mp4")
    zoom_panel(raw_path, total_duration, zoomed_path)
    return zoomed_path


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
    scenes = data["scenes"]
    panels = data["panels"]

    missing = [s for s in scenes if "image" not in s or not os.path.isfile(os.path.join(OUTPUT_DIR, s["image"]))]
    if missing:
        print(f"{len(missing)} image(s) manquante(s). Lancez d'abord 03_render_frames.py.")
        sys.exit(1)

    if not os.path.isfile(AUDIO_PATH):
        print(f"Audio introuvable: {AUDIO_PATH}")
        sys.exit(1)

    scenes_by_index = {s["index"]: s for s in scenes}

    audio_duration = ffprobe_duration(AUDIO_PATH)
    panels_end = panels[-1]["end"]
    if audio_duration > panels_end:
        extra = round(audio_duration - panels_end, 3)
        panels[-1]["duration"] = round(panels[-1]["duration"] + extra, 3)
        last_idx = panels[-1]["scene_indices"][-1]
        scenes_by_index[last_idx]["duration"] = round(scenes_by_index[last_idx]["duration"] + extra, 3)

    os.makedirs(SEGMENTS_DIR, exist_ok=True)
    os.makedirs(PANELS_DIR, exist_ok=True)

    print(f"Construction de {len(panels)} panneaux (plans continus, zoom sans à-coup)...")
    clip_paths = []
    content_durations = []
    for i, panel in enumerate(panels):
        pad_tail = TRANSITION_DUR if i < len(panels) - 1 else 0.0
        print(f"  [{i+1}/{len(panels)}] panneau {panel['panel']:02d} "
              f"({panel['category']}, {panel['duration']:.1f}s, {len(panel['scene_indices'])} scène(s))")
        zoomed_path = build_panel_clip(panel, scenes_by_index, pad_tail, PANELS_DIR)
        clip_paths.append(zoomed_path)
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
