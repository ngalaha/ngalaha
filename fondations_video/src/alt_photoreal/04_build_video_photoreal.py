"""
Etape 4 : Montage & assemblage (FFmpeg).

Pour chaque scène : applique un effet Ken Burns (zoom + léger panoramique)
sur l'image, assemble tous les clips sur la piste audio d'origine, puis
incruste les sous-titres .srt.

Usage:
    python3 src/04_build_video.py [--output erreur_fatale_fondations.mp4]

Entrées:
    output/scenes.json  (avec le champ "image" rempli par 03_generate_images.py)
    output/subtitles.srt
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

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUT_DIR = os.path.join(ROOT, "output")
CLIPS_DIR = os.path.join(OUTPUT_DIR, "clips")
AUDIO_PATH = os.path.join(ROOT, "input", "audio.mp3")

FPS = 30
WIDTH, HEIGHT = 1920, 1080
UPSCALE_W, UPSCALE_H = 3840, 2160  # zoompan sur une image plus grande = zoom plus fluide
MAX_ZOOM = 1.18


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


def build_ken_burns_clip(image_path, duration, variant, out_path):
    frames = max(1, round(duration * FPS))
    d_total = max(frames - 1, 1)
    increment = (MAX_ZOOM - 1) / frames

    directions = {
        0: (0, 0),   # zoom pur, centré
        1: (1, 0),   # zoom + pan vers la droite
        2: (-1, 0),  # zoom + pan vers la gauche
        3: (0, 1),   # zoom + pan vers le bas
        4: (0, -1),  # zoom + pan vers le haut
    }
    dx, dy = directions[variant % len(directions)]

    zoom_expr = f"min(zoom+{increment:.8f},{MAX_ZOOM})"
    x_expr = f"(iw-iw/zoom)/2+({dx})*(iw-iw/zoom)/2*(on/{d_total})"
    y_expr = f"(ih-ih/zoom)/2+({dy})*(ih-ih/zoom)/2*(on/{d_total})"

    vf = (
        f"scale={UPSCALE_W}:{UPSCALE_H}:force_original_aspect_ratio=increase,"
        f"crop={UPSCALE_W}:{UPSCALE_H},"
        f"zoompan=z='{zoom_expr}':d=1:x='{x_expr}':y='{y_expr}':s={WIDTH}x{HEIGHT}:fps={FPS},"
        f"format=yuv420p"
    )

    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-loop", "1", "-framerate", str(FPS), "-i", image_path,
        "-vf", vf,
        "-frames:v", str(frames),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        out_path,
    ]
    run(cmd)
    return frames


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=os.path.join(ROOT, "erreur_fatale_fondations.mp4"))
    parser.add_argument("--no-subtitles", action="store_true")
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        print("ffmpeg/ffprobe introuvable. Installez-le (ex: 'sudo apt-get install ffmpeg').")
        sys.exit(1)

    with open(os.path.join(OUTPUT_DIR, "scenes.json"), "r", encoding="utf-8") as f:
        scenes = json.load(f)

    missing = [s for s in scenes if "image" not in s or not os.path.isfile(os.path.join(OUTPUT_DIR, s["image"]))]
    if missing:
        print(f"{len(missing)} image(s) manquante(s). Lancez d'abord 03_generate_images.py.")
        sys.exit(1)

    if not os.path.isfile(AUDIO_PATH):
        print(f"Audio introuvable: {AUDIO_PATH}")
        sys.exit(1)

    audio_duration = ffprobe_duration(AUDIO_PATH)
    scenes_end = scenes[-1]["end"]
    # Ajuste la dernière scène pour couvrir toute la durée de l'audio
    if audio_duration > scenes_end:
        scenes[-1]["duration"] = round(scenes[-1]["duration"] + (audio_duration - scenes_end), 3)

    os.makedirs(CLIPS_DIR, exist_ok=True)

    print(f"Génération de {len(scenes)} clips Ken Burns ({WIDTH}x{HEIGHT} @ {FPS}fps)...")
    clip_paths = []
    for i, scene in enumerate(scenes):
        image_path = os.path.join(OUTPUT_DIR, scene["image"])
        clip_path = os.path.join(CLIPS_DIR, f"clip_{scene['index']:03d}.mp4")
        clip_paths.append(clip_path)
        if os.path.isfile(clip_path):
            print(f"  [{i+1}/{len(scenes)}] déjà généré: {os.path.basename(clip_path)}")
            continue
        print(f"  [{i+1}/{len(scenes)}] {os.path.basename(clip_path)} "
              f"(durée={scene['duration']:.2f}s)")
        build_ken_burns_clip(image_path, max(scene["duration"], 0.5), i, clip_path)

    concat_list_path = os.path.join(OUTPUT_DIR, "concat_list.txt")
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for p in clip_paths:
            f.write(f"file '{p}'\n")

    silent_video_path = os.path.join(OUTPUT_DIR, "video_silent.mp4")
    print("Assemblage des clips (concaténation)...")
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", concat_list_path,
        "-c", "copy", silent_video_path,
    ])

    video_with_audio_path = os.path.join(OUTPUT_DIR, "video_with_audio.mp4")
    print("Ajout de la piste audio d'origine...")
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", silent_video_path, "-i", AUDIO_PATH,
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        video_with_audio_path,
    ])

    final_output = args.output
    if args.no_subtitles:
        shutil.copyfile(video_with_audio_path, final_output)
    else:
        srt_path = os.path.join(OUTPUT_DIR, "subtitles.srt")
        print("Incrustation des sous-titres...")
        escaped_srt = srt_path.replace("\\", "\\\\").replace(":", "\\:")
        style = (
            "FontName=DejaVu Sans,FontSize=20,PrimaryColour=&H00FFFFFF,"
            "OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0,"
            "Alignment=2,MarginV=40"
        )
        run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", video_with_audio_path,
            "-vf", f"subtitles='{escaped_srt}':force_style='{style}'",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-c:a", "copy",
            final_output,
        ])

    print(f"\nVidéo finale générée: {final_output}")


if __name__ == "__main__":
    main()
