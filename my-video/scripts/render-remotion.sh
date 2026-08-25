#!/usr/bin/env bash
# Render a registered Remotion composition to MP4.
#
# Usage: scripts/render-remotion.sh <compositionId> <outputPath> [publicDir]
#
# Chromium's official lightweight download (remotion.media) is blocked by
# this sandbox's egress policy, so this reuses the Playwright-provisioned
# headless shell instead. Override with REMOTION_BROWSER_EXECUTABLE if a
# different environment doesn't need this.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

DEFAULT_BROWSER="/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
BROWSER_EXECUTABLE="${REMOTION_BROWSER_EXECUTABLE:-$DEFAULT_BROWSER}"

usage() {
  echo "Usage: $0 <compositionId> <outputPath> [publicDir]" >&2
  exit 1
}

COMPOSITION_ID="${1:-}"
OUTPUT_PATH="${2:-}"
PUBLIC_DIR="${3:-}"

[ -z "$COMPOSITION_ID" ] && usage
[ -z "$OUTPUT_PATH" ] && usage

cd "$ROOT_DIR"

ARGS=(render src/index.ts "$COMPOSITION_ID" "$OUTPUT_PATH")
if [ -x "$BROWSER_EXECUTABLE" ]; then
  ARGS+=("--browser-executable=$BROWSER_EXECUTABLE")
fi
if [ -n "$PUBLIC_DIR" ]; then
  ARGS+=("--public-dir=$PUBLIC_DIR")
fi

npx remotion "${ARGS[@]}"
