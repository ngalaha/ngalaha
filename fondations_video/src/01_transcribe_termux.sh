#!/data/data/com.termux/files/usr/bin/bash
# Etape 1 (variante Termux/Android) : transcription via whisper.cpp.
#
# openai-whisper (script 01_transcribe.py) dépend de PyTorch, qui n'a pas de
# wheel précompilé pour Termux (libc bionic != glibc) : `pip install torch`
# échoue sur téléphone. whisper.cpp est l'implémentation C++ sans PyTorch,
# optimisée ARM/NEON, faite pour tourner sur mobile.
#
# Prérequis (voir README.md, section Termux) :
#   pkg install clang cmake git ffmpeg python
#   git clone https://github.com/ggerganov/whisper.cpp ~/whisper.cpp
#   cd ~/whisper.cpp && cmake -B build && cmake --build build --config Release
#   bash ./models/download-ggml-model.sh base   # modèle MULTILINGUE (pas .en)
#
# Usage:
#   ./src/01_transcribe_termux.sh [chemin_audio] [langue]
#   ./src/01_transcribe_termux.sh input/audio.mp3 fr
#
# Variables surchargeables:
#   WHISPER_CPP_DIR  (def: ~/whisper.cpp)
#   WHISPER_BIN      (def: auto-détecté dans WHISPER_CPP_DIR)
#   WHISPER_MODEL    (def: $WHISPER_CPP_DIR/models/ggml-base.bin)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

AUDIO_INPUT="${1:-input/audio.mp3}"
LANGUAGE="${2:-fr}"
WHISPER_CPP_DIR="${WHISPER_CPP_DIR:-$HOME/whisper.cpp}"
WHISPER_MODEL="${WHISPER_MODEL:-$WHISPER_CPP_DIR/models/ggml-base.bin}"

if [ -z "${WHISPER_BIN:-}" ]; then
    for candidate in \
        "$WHISPER_CPP_DIR/build/bin/whisper-cli" \
        "$WHISPER_CPP_DIR/build/bin/main" \
        "$WHISPER_CPP_DIR/main"; do
        if [ -x "$candidate" ]; then
            WHISPER_BIN="$candidate"
            break
        fi
    done
fi

if [ -z "${WHISPER_BIN:-}" ] || [ ! -x "$WHISPER_BIN" ]; then
    echo "Binaire whisper.cpp introuvable. Compilez-le d'abord (voir README.md,"
    echo "section Termux) ou définissez WHISPER_BIN=/chemin/vers/le/binaire."
    exit 1
fi

if [ ! -f "$WHISPER_MODEL" ]; then
    echo "Modèle introuvable: $WHISPER_MODEL"
    echo "Téléchargez-le avec: bash $WHISPER_CPP_DIR/models/download-ggml-model.sh base"
    echo "(utilisez un modèle MULTILINGUE, sans suffixe .en, pour du français)"
    exit 1
fi

if [ ! -f "$AUDIO_INPUT" ]; then
    echo "Fichier audio introuvable: $AUDIO_INPUT"
    exit 1
fi

mkdir -p output

WAV_PATH="output/audio_16k.wav"
echo "Conversion audio -> 16kHz mono WAV..."
ffmpeg -y -loglevel error -i "$AUDIO_INPUT" -ar 16000 -ac 1 -c:a pcm_s16le "$WAV_PATH"

echo "Passe 1/2 : sous-titres (segmentation par phrase)..."
"$WHISPER_BIN" -m "$WHISPER_MODEL" -f "$WAV_PATH" -l "$LANGUAGE" \
    -osrt -of output/subtitles_raw

echo "Passe 2/2 : timestamps mot par mot (pour le découpage en scènes)..."
"$WHISPER_BIN" -m "$WHISPER_MODEL" -f "$WAV_PATH" -l "$LANGUAGE" \
    -ml 1 -oj -of output/words_raw

mv output/subtitles_raw.srt output/subtitles.srt

echo "Conversion vers transcript.json..."
python3 src/whispercpp_to_transcript.py output/words_raw.json output/transcript.json

echo ""
echo "-> output/transcript.json"
echo "-> output/subtitles.srt"
echo "Transcription terminée."
