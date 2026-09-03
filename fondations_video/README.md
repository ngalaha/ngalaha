# Audio → Vidéo : "Erreur fatale fondations"

Pipeline 100% gratuit et local qui transforme un fichier audio (narration) en
vidéo complète : transcription automatique, découpage en scènes visuelles,
génération d'images IA gratuites (Pollinations.ai), montage Ken Burns et
incrustation de sous-titres.

## ⚠️ Pourquoi ce n'est pas exécuté automatiquement dans cette session

Cette session tourne dans un environnement cloud isolé dont l'accès réseau
sortant est restreint par une politique d'organisation. Trois domaines
indispensables au pipeline sont bloqués ici :

- `openaipublic.azureedge.net` (téléchargement du modèle Whisper)
- `huggingface.co` (repli faster-whisper)
- `image.pollinations.ai` (génération d'images gratuite)

Le code ci-dessous a été écrit et **testé** (montage Ken Burns, concaténation,
piste audio, incrustation de sous-titres — validés avec des données de test
dans cet environnement). Il ne lui manque que d'être exécuté dans un endroit
avec un accès internet normal (votre machine, un Codespace, un VPS...).

## Utilisation

```bash
# 1. Placez votre fichier audio dans input/audio.mp3
cp /chemin/vers/votre_audio.mp3 input/audio.mp3

# 2. Lancez tout le pipeline (installe les dépendances automatiquement)
./run_pipeline.sh
```

Ou étape par étape :

```bash
python3 -m pip install -r requirements.txt
sudo apt-get install -y ffmpeg   # si besoin

python3 src/01_transcribe.py input/audio.mp3 --model small
python3 src/02_scene_prompts.py
python3 src/03_generate_images.py
python3 src/04_build_video.py
```

Le fichier final est généré à la racine du projet :
**`erreur_fatale_fondations.mp4`**

## Étapes du pipeline

1. **`01_transcribe.py`** — Transcrit l'audio avec [openai-whisper](https://github.com/openai/whisper)
   (100% local, gratuit, aucune clé API). Produit `output/transcript.json`
   (timestamps mot par mot) et `output/subtitles.srt`.
   *Sur Termux/Android, utilisez `01_transcribe_termux.sh` à la place (voir
   section dédiée plus bas) : même sortie, sans dépendance PyTorch.*

2. **`02_scene_prompts.py`** — Regroupe les mots transcrits en scènes de
   3 à 8 secondes (en respectant les fins de phrase quand possible), puis
   génère pour chaque scène un prompt anglais détaillé orienté génie civil
   / structures / fondations (fissures, semelles, béton armé, forage
   géotechnique, tassement de sol, effondrement, etc.) via une détection de
   mots-clés bilingue FR/EN, avec une rotation de motifs de secours pour les
   scènes sans mot-clé technique explicite. Produit `output/scenes.json`.

3. **`03_generate_images.py`** — Télécharge une image HD (1920×1080,
   modèle `flux`) pour chaque scène via l'API gratuite
   [Pollinations.ai](https://image.pollinations.ai/), sans clé API,
   avec reprise automatique en cas d'échec/interruption.

4. **`04_build_video.py`** — Pour chaque image, génère un clip vidéo avec un
   effet Ken Burns (zoom progressif + léger panoramique, direction variée par
   scène) via le filtre `zoompan` de FFmpeg, concatène tous les clips,
   ajoute la piste audio d'origine, puis incruste les sous-titres `.srt`
   (filtre `subtitles`/libass). Tout est fait en appelant directement le
   binaire `ffmpeg` (plus robuste et sans dépendance à ImageMagick que
   MoviePy pour un pipeline entièrement automatisé).

## Sur smartphone (Termux / Android)

Ça fonctionne, avec un seul changement : `openai-whisper` dépend de
**PyTorch**, qui n'a pas de wheel précompilé pour Termux (libc `bionic`,
différente de `glibc`) — `pip install torch` échouera. On utilise à la place
[whisper.cpp](https://github.com/ggerganov/whisper.cpp) (C++, sans PyTorch,
optimisé ARM/NEON). Le reste du pipeline (FFmpeg, appels réseau vers
Pollinations.ai) fonctionne nativement sur Termux.

```bash
pkg update && pkg install -y clang cmake git ffmpeg python

git clone https://github.com/ggerganov/whisper.cpp ~/whisper.cpp
cd ~/whisper.cpp
cmake -B build && cmake --build build --config Release -j$(nproc)
# Modèle MULTILINGUE (sans suffixe .en) pour du français :
bash ./models/download-ggml-model.sh base

cd ~/fondations_video    # ou l'emplacement où vous avez dézippé le projet
python3 -m pip install requests

./src/01_transcribe_termux.sh input/audio.mp3 fr   # au lieu de 01_transcribe.py
python3 src/02_scene_prompts.py
python3 src/03_generate_images.py
python3 src/04_build_video.py
```

`01_transcribe_termux.sh` fait tourner whisper.cpp deux fois (une passe pour
des sous-titres lisibles, une passe `-ml 1` pour des timestamps mot par mot)
et convertit sa sortie JSON vers le même `output/transcript.json` que
`01_transcribe.py` — les étapes 2, 3 et 4 sont donc identiques, sans aucune
modification.

Le modèle `base` est un bon compromis vitesse/qualité sur téléphone ; `small`
est plus précis mais plus lent sur CPU mobile. Le binaire compilé se trouve
dans `~/whisper.cpp/build/bin/` (`whisper-cli` ou `main` selon la version) —
le script le détecte automatiquement, sinon fixez `WHISPER_BIN=...`.

## Reprise après interruption

- `03_generate_images.py` ne re-télécharge pas les images déjà présentes
  dans `output/images/` : relancez-le simplement pour reprendre là où il
  s'est arrêté.
- `04_build_video.py` ne régénère pas les clips déjà présents dans
  `output/clips/`.

## Personnalisation

- **Qualité/vitesse de transcription** : changez `--model` (`tiny`, `base`,
  `small`, `medium`, `large`) dans `run_pipeline.sh` ou à l'appel de
  `01_transcribe.py`. `small` est un bon compromis gratuit CPU.
- **Style visuel** : ajustez `STYLE_SUFFIX` et les motifs `KEYWORD_MOTIFS` /
  `FALLBACK_ROTATION` dans `02_scene_prompts.py`.
- **Intensité du zoom** : `MAX_ZOOM` dans `04_build_video.py`.
- **Style des sous-titres** : la variable `style` (police, taille, couleurs)
  dans `04_build_video.py`.
