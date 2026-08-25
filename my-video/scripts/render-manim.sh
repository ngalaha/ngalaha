#!/usr/bin/env bash
# Render a Manim scene into a project's public/manim-render (or any dir).
#
# Usage: scripts/render-manim.sh <scene.py> <SceneClassName> <output_dir> [quality]
#   quality: l|m|h|k (default: h = 1080p60)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MANIM_BIN="$ROOT_DIR/.venv/bin/manim"

usage() {
  echo "Usage: $0 <scene.py> <SceneClassName> <output_dir> [quality: l|m|h|k]" >&2
  exit 1
}

SCENE_FILE="${1:-}"
SCENE_CLASS="${2:-}"
OUTPUT_DIR="${3:-}"
QUALITY="${4:-h}"

[ -z "$SCENE_FILE" ] && usage
[ -z "$SCENE_CLASS" ] && usage
[ -z "$OUTPUT_DIR" ] && usage

if [ ! -f "$SCENE_FILE" ]; then
  echo "Script Manim introuvable: $SCENE_FILE" >&2
  exit 1
fi
if [ ! -x "$MANIM_BIN" ]; then
  echo "Manim introuvable dans le venv: $MANIM_BIN (voir engine/README.md)" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
"$MANIM_BIN" "-q${QUALITY}" --media_dir "$OUTPUT_DIR" "$SCENE_FILE" "$SCENE_CLASS"
