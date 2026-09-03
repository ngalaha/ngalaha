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
