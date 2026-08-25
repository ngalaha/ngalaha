#!/usr/bin/env python3
"""Transcribe an audio file to an SRT file using faster-whisper (CPU only).

Project-agnostic: pass any audio path and destination .srt path, typically
projects/<slug>/public/audio/sceneX.mp3 -> projects/<slug>/public/captions/sceneX.srt

Must be run with the dedicated venv (it is the only place faster-whisper is
installed):
    .venv/bin/python scripts/transcribe.py <audio> <output.srt> [--model base] [--language fr]
"""

import argparse
import sys
from pathlib import Path


def format_timestamp(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    hours, total_ms = divmod(total_ms, 3_600_000)
    minutes, total_ms = divmod(total_ms, 60_000)
    secs, ms = divmod(total_ms, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path, help="Chemin du fichier audio d'entree")
    parser.add_argument("output", type=Path, help="Chemin du .srt a ecrire")
    parser.add_argument(
        "--model",
        default="base",
        help="Modele Whisper: tiny, base, small, medium (defaut: base)",
    )
    parser.add_argument(
        "--language",
        default=None,
        help="Code langue (ex: fr). Auto-detectee si omis",
    )
    args = parser.parse_args()

    if not args.audio.exists():
        print(f"Fichier audio introuvable: {args.audio}", file=sys.stderr)
        return 1

    from faster_whisper import WhisperModel

    print(f"Chargement du modele '{args.model}' (CPU, int8)...", file=sys.stderr)
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    segments, info = model.transcribe(str(args.audio), language=args.language)
    print(
        f"Langue detectee: {info.language} (p={info.language_probability:.2f})",
        file=sys.stderr,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with args.output.open("w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, start=1):
            f.write(f"{i}\n")
            f.write(f"{format_timestamp(seg.start)} --> {format_timestamp(seg.end)}\n")
            f.write(f"{seg.text.strip()}\n\n")
            count += 1

    print(f"{count} segment(s) ecrits dans {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
