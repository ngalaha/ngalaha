"""
Etape 1 : Transcription audio + sous-titres .srt (100% local, via openai-whisper).

Usage:
    python3 src/01_transcribe.py [chemin_audio] [--model small]

Produit:
    output/transcript.json   (segments + mots avec timestamps précis)
    output/subtitles.srt     (sous-titres prêts à incruster)
"""
import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_AUDIO = os.path.join(ROOT, "input", "audio.mp3")
OUTPUT_DIR = os.path.join(ROOT, "output")


def format_srt_timestamp(seconds: float) -> str:
    if seconds < 0:
        seconds = 0
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis == 1000:
        millis = 0
        secs += 1
        if secs == 60:
            secs = 0
            minutes += 1
            if minutes == 60:
                minutes = 0
                hours += 1
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def write_srt(segments, path):
    with open(path, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, start=1):
            f.write(f"{i}\n")
            f.write(f"{format_srt_timestamp(seg['start'])} --> {format_srt_timestamp(seg['end'])}\n")
            f.write(f"{seg['text'].strip()}\n\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", nargs="?", default=DEFAULT_AUDIO)
    parser.add_argument("--model", default="small",
                         help="tiny|base|small|medium|large (small = bon compromis vitesse/qualité, gratuit, local)")
    parser.add_argument("--language", default=None, help="Forcer une langue, ex: fr (sinon auto-détection)")
    args = parser.parse_args()

    if not os.path.isfile(args.audio):
        print(f"Fichier audio introuvable: {args.audio}")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"[1/1] Chargement du modèle Whisper '{args.model}' (téléchargé une seule fois, mis en cache localement)...")
    import whisper
    model = whisper.load_model(args.model)

    print(f"Transcription de: {args.audio}")
    result = model.transcribe(
        args.audio,
        language=args.language,
        word_timestamps=True,
        verbose=False,
        fp16=False,
    )

    segments = result["segments"]

    transcript_path = os.path.join(OUTPUT_DIR, "transcript.json")
    with open(transcript_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "language": result.get("language"),
                "text": result.get("text", "").strip(),
                "segments": [
                    {
                        "start": s["start"],
                        "end": s["end"],
                        "text": s["text"].strip(),
                        "words": [
                            {"word": w["word"], "start": w["start"], "end": w["end"]}
                            for w in s.get("words", [])
                        ],
                    }
                    for s in segments
                ],
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    srt_path = os.path.join(OUTPUT_DIR, "subtitles.srt")
    write_srt(segments, srt_path)

    print(f"Langue détectée: {result.get('language')}")
    print(f"-> {transcript_path}")
    print(f"-> {srt_path}")
    print("Transcription terminée.")


if __name__ == "__main__":
    main()
