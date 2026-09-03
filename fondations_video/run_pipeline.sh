#!/usr/bin/env bash
# Pipeline complet : audio -> vidéo (transcription, prompts, images IA
# gratuites, montage Ken Burns, sous-titres).
#
# Usage:
#   ./run_pipeline.sh [chemin_vers_audio.mp3] [modele_whisper]
#
# Si aucun argument n'est donné, utilise input/audio.mp3 et le modèle
# whisper "small".
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

AUDIO_INPUT="${1:-input/audio.mp3}"
WHISPER_MODEL="${2:-small}"

echo "=== Installation des dépendances ==="

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ffmpeg introuvable, installation..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y ffmpeg
    elif command -v brew >/dev/null 2>&1; then
        brew install ffmpeg
    else
        echo "Impossible d'installer ffmpeg automatiquement sur ce système."
        echo "Installez-le manuellement puis relancez ce script."
        exit 1
    fi
else
    echo "ffmpeg déjà installé."
fi

python3 -m pip install --upgrade pip >/dev/null
python3 -m pip install -r requirements.txt

if [ ! -f "$AUDIO_INPUT" ]; then
    echo "Fichier audio introuvable: $AUDIO_INPUT"
    exit 1
fi

mkdir -p input output
if [ "$AUDIO_INPUT" != "input/audio.mp3" ]; then
    cp "$AUDIO_INPUT" input/audio.mp3
fi

echo ""
echo "=== Etape 1/4 : Transcription (Whisper, modèle '$WHISPER_MODEL') ==="
python3 src/01_transcribe.py input/audio.mp3 --model "$WHISPER_MODEL"

echo ""
echo "=== Etape 2/4 : Découpage en scènes + prompts visuels ==="
python3 src/02_scene_prompts.py

echo ""
echo "=== Etape 3/4 : Génération des images (Pollinations.ai, gratuit) ==="
python3 src/03_generate_images.py

echo ""
echo "=== Etape 4/4 : Montage vidéo (Ken Burns + sous-titres) ==="
python3 src/04_build_video.py

echo ""
echo "=== Terminé ! ==="
echo "Vidéo finale : $SCRIPT_DIR/erreur_fatale_fondations.mp4"
