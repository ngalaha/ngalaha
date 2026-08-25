#!/usr/bin/env bash
# Scaffold a new projects/<slug>/ from projects/_template.
#
# Usage: scripts/new-project.sh <slug> "<title>" [vertical|landscape]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

usage() {
  echo "Usage: $0 <slug> \"<title>\" [vertical|landscape]" >&2
  echo "  slug   : minuscules/chiffres/tirets, ex: recette-beton" >&2
  echo "  format : vertical (defaut, 1080x1920) ou landscape (1920x1080)" >&2
  exit 1
}

SLUG="${1:-}"
TITLE="${2:-}"
FORMAT="${3:-vertical}"

[ -z "$SLUG" ] && usage
[ -z "$TITLE" ] && usage

if [[ ! "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Slug invalide: $SLUG (minuscules, chiffres, tirets uniquement)" >&2
  exit 1
fi
if [[ "$FORMAT" != "vertical" && "$FORMAT" != "landscape" ]]; then
  echo "Format invalide: $FORMAT (attendu: vertical ou landscape)" >&2
  exit 1
fi

DEST="$ROOT_DIR/projects/$SLUG"
if [ -e "$DEST" ]; then
  echo "Le projet existe deja: $DEST" >&2
  exit 1
fi

cp -r "$ROOT_DIR/projects/_template" "$DEST"

python3 - "$DEST/project.json" "$SLUG" "$TITLE" "$FORMAT" <<'PY'
import json, sys
path, slug, title, fmt = sys.argv[1:5]
with open(path) as f:
    data = json.load(f)
data["slug"] = slug
data["title"] = title
data["format"] = fmt
data["status"] = "draft"
data["createdFrom"] = "_template"
with open(path, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY

python3 - "$DEST/script.json" "$SLUG" "$TITLE" "$FORMAT" <<'PY'
import json, sys
path, slug, title, fmt = sys.argv[1:5]
with open(path) as f:
    data = json.load(f)
data["slug"] = slug
data["title"] = title
data["format"] = fmt
with open(path, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY

echo "Projet cree : $DEST (format: $FORMAT)"
echo "Prochaines etapes : remplir script.json, deposer la voix off dans public/audio/, puis scripts/produce.sh $SLUG"
