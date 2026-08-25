#!/usr/bin/env bash
# Run the automatable steps of the pipeline for one project.
#
# Usage: scripts/produce.sh <project-slug>
#
# Does today: transcribe any public/audio/* missing a .srt, check sources.json
# coverage. Does NOT render Remotion: a composition must first be registered
# in a Root.tsx for this project (see engine/README.md) — then use
# scripts/render-remotion.sh directly.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

usage() {
  echo "Usage: $0 <project-slug>" >&2
  exit 1
}

SLUG="${1:-}"
[ -z "$SLUG" ] && usage

PROJECT_DIR="$ROOT_DIR/projects/$SLUG"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Projet introuvable: $PROJECT_DIR" >&2
  exit 1
fi

echo "== $SLUG : transcription =="
AUDIO_DIR="$PROJECT_DIR/public/audio"
CAPTIONS_DIR="$PROJECT_DIR/public/captions"
if [ -d "$AUDIO_DIR" ]; then
  shopt -s nullglob
  found=0
  for audio in "$AUDIO_DIR"/*.mp3 "$AUDIO_DIR"/*.wav; do
    found=1
    base="$(basename "${audio%.*}")"
    srt="$CAPTIONS_DIR/$base.srt"
    if [ -f "$srt" ]; then
      echo "  $base : .srt deja present, ignore"
    else
      echo "  $base : transcription..."
      "$ROOT_DIR/.venv/bin/python" "$SCRIPT_DIR/transcribe.py" "$audio" "$srt" --language fr
    fi
  done
  shopt -u nullglob
  if [ "$found" -eq 0 ]; then
    echo "  (public/audio est vide, rien a transcrire)"
  fi
else
  echo "  (pas de public/audio, rien a transcrire)"
fi

echo "== $SLUG : verification des sources =="
node "$SCRIPT_DIR/check-sources.mjs" "$SLUG" || true

echo
echo "Etapes restantes pour ce projet (manuelles pour l'instant) :"
echo "  - rendu Manim :    scripts/render-manim.sh <scene.py> <Classe> $PROJECT_DIR/public/manim-render"
echo "  - rendu Remotion : scripts/render-remotion.sh <compositionId> $PROJECT_DIR/render/final.mp4 $PROJECT_DIR/public"
