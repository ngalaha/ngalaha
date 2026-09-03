# Audio → Vidéo : "Erreur fatale fondations"

Pipeline 100% gratuit qui transforme un fichier audio (narration) en vidéo
verticale (1080×1920, format Reels/TikTok/Shorts) façon **plan d'architecte** :
transcription automatique, découpage en scènes, diagrammes techniques
vectoriels générés localement (fissures, semelles, coupes, sondages
géotechniques...), montage avec zoom discret et légendes incrustées.

Le style reproduit une référence fournie par l'utilisateur : fond blanc,
lignes noires, hachures, une seule couleur d'accent (bordeaux), cotes et
callouts techniques, numérotation de planches façon "01, 02, 03...", barre
de progression et tag "GÉNIE CIVIL" en pied de page.

**Aucune génération d'image IA n'est utilisée** — les diagrammes sont
dessinés programmatiquement (Pillow), donc l'étape la plus longue et la
moins fiable de l'ancienne approche (appels réseau à une API d'images)
disparaît entièrement : plus rapide, 100% reproductible, et ça tourne très
bien sur téléphone.

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
python3 src/02_scene_diagrams.py
python3 src/03_render_frames.py
python3 src/04_build_video.py
```

Le fichier final est généré à la racine du projet :
**`erreur_fatale_fondations.mp4`**

## Étapes du pipeline

1. **`01_transcribe.py`** — Transcrit l'audio avec [openai-whisper](https://github.com/openai/whisper)
   (100% local, gratuit, aucune clé API). Produit `output/transcript.json`
   (timestamps mot par mot).
   *Sur Termux/Android, utilisez `01_transcribe_termux.sh` à la place (voir
   section dédiée plus bas) : même sortie, sans dépendance PyTorch.*

2. **`02_scene_diagrams.py`** — Regroupe les mots transcrits en scènes de
   3 à 8 secondes (en respectant les fins de phrase quand possible), puis
   associe chaque scène à une **catégorie de diagramme** (fissure,
   affaissement, semelle de fondation, béton armé, forage géotechnique,
   nature du sol, infiltration d'eau, effondrement, diagnostic, fondations
   profondes, mur de soutènement, plan de situation, normes...) via une
   détection de mots-clés bilingue FR/EN. Les scènes **consécutives de même
   catégorie sont regroupées en "panneaux"** numérotés (le diagramme et le
   titre restent stables pendant qu'un sujet se développe, comme dans la
   référence). Chaque scène est chaînée jusqu'au **début exact de la
   suivante** (les silences entre segments de parole ne sont donc jamais
   "perdus") pour un calage image/voix off au frame près. Produit
   `output/scenes.json` (`scenes` + `panels`).

3. **`03_render_frames.py`** — Dessine chaque image en 1080×1920 avec
   [Pillow](https://python-pillow.org/) : en-tête (numéro de planche, titre,
   annotation technique), diagramme vectoriel (hachures, cotes, callouts,
   texture béton...), légende (texte de la scène) et pied de page (barre de
   progression, tag "GÉNIE CIVIL", pagination). Le diagramme est identique
   pour toutes les scènes d'un même panneau (même valeur de départ
   aléatoire) : à l'étape 4, la caméra tient un seul plan continu sur tout
   le panneau. **100% local, aucun réseau.** Produit
   `output/frames/scene_NNN.png`.

4. **`04_build_video.py`** — Pour chaque panneau : les scènes qui le
   composent sont mises bout à bout en un plan continu, sur lequel un zoom
   discret **sans aucune remise à zéro** est appliqué (contrairement à un
   zoom par scène, qui créerait un saut visible à chaque changement de
   légende). Les panneaux sont ensuite enchaînés avec un **fondu croisé**
   (transition de 0,4 s) au lieu d'une coupe franche — chaque panneau (sauf
   le dernier) porte une queue supplémentaire de cette durée, consommée par
   le fondu suivant, pour que la durée totale reste calée à la frame près
   sur la piste audio d'origine, ajoutée en dernière étape.

## Bibliothèque de diagrammes (`src/diagrams.py`)

Chaque catégorie a sa propre illustration technique dans `src/diagrams.py` :
coupe de mur fissuré, élévation de bâtiment incliné, plan de semelles
hachurées, coupe béton armé avec armatures, sondage géotechnique stratifié,
coupe de sol, infiltration de nappe phréatique, bâtiment effondré,
inspection à la jauge fissurométrique, plan de situation, fouille de
terrassement, pieux forés, mur de soutènement sous poussée des terres, et
un cartouche de norme technique. Le style visuel commun (palette, polices,
hachures, cotes, callouts, en-tête/pied de page) est centralisé dans
`src/style.py`.

## Sur smartphone (Termux / Android)

`openai-whisper` dépend de **PyTorch**, qui n'a pas de wheel précompilé pour
Termux (libc `bionic`, différente de `glibc`) — `pip install torch`
échouera. On utilise à la place
[whisper.cpp](https://github.com/ggerganov/whisper.cpp) (C++, sans PyTorch,
optimisé ARM/NEON). Le reste du pipeline (FFmpeg, rendu Pillow) est 100%
local et fonctionne nativement sur Termux, sans accès réseau requis en
dehors du téléchargement initial du modèle Whisper.

```bash
pkg update && pkg install -y clang cmake git ffmpeg python python-pillow

git clone https://github.com/ggerganov/whisper.cpp ~/whisper.cpp
cd ~/whisper.cpp
cmake -B build && cmake --build build --config Release -j$(nproc)
# Modèle MULTILINGUE (sans suffixe .en) pour du français :
bash ./models/download-ggml-model.sh base

cd ~/fondations_video    # ou l'emplacement où vous avez dézippé le projet

./src/01_transcribe_termux.sh input/audio.mp3 fr   # au lieu de 01_transcribe.py
python3 src/02_scene_diagrams.py
python3 src/03_render_frames.py
python3 src/04_build_video.py
```

`python-pillow` (paquet Termux précompilé) évite de compiler Pillow depuis
les sources sur téléphone — préférez-le à `pip install Pillow`.

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

- `04_build_video.py` ne régénère pas les clips par scène déjà présents
  dans `output/segments/` (mais régénère toujours le plan par panneau et
  l'assemblage final — rapide).
- Relancer `03_render_frames.py` régénère toutes les images (rapide, tout
  est local) — pratique après avoir ajusté le style.

## Personnalisation

- **Qualité/vitesse de transcription** : changez `--model` (`tiny`, `base`,
  `small`, `medium`, `large`) dans `run_pipeline.sh` ou à l'appel de
  `01_transcribe.py`. `small` est un bon compromis gratuit CPU.
- **Palette / polices / mise en page** : `src/style.py` (couleurs `INK`,
  `ACCENT`, `GRAY`... et les fonctions `header()`/`footer()`).
- **Diagrammes** : `src/diagrams.py` — chaque catégorie a sa fonction
  (`crack_section`, `tilt_elevation`, `foundation_plan`, etc.).
- **Titres/annotations par catégorie** : `CATEGORY_HEADER` dans
  `src/02_scene_diagrams.py`.
- **Intensité/vitesse du zoom** : `MIN_ZOOM_TARGET`, `MAX_ZOOM_TARGET`,
  `ZOOM_RATE_PER_SEC` dans `04_build_video.py`.
- **Durée des transitions** : `TRANSITION_DUR` dans `04_build_video.py`
  (0,4 s par défaut).

## Ancienne approche (images IA photoréalistes)

La première version du pipeline générait des images photoréalistes via
l'API gratuite [Pollinations.ai](https://image.pollinations.ai/) au format
16:9. Ces scripts sont conservés dans `src/alt_photoreal/` si vous préférez
ce style : `02_scene_prompts.py`, `03_generate_images.py` et
`04_build_video_photoreal.py` (16:9, sous-titres `.srt` gravés). Cette
approche nécessite un accès réseau non restreint (bloqué dans certains
environnements cloud) et est plus lente (téléchargement d'images).
