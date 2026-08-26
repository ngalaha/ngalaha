# Engine

Code réutilisable, commun à toutes les vidéos. Rien ici ne dépend du contenu
d'une vidéo en particulier — ça vit dans `projects/<slug>/`.

## `remotion/`

- `formats.ts` — les deux formats supportés :
  - `VERTICAL` (1080×1920, 9:16) — **format par défaut**, pour Facebook/Reels.
  - `LANDSCAPE` (1920×1080, 16:9) — toujours disponible pour du YouTube/web.
- `format-context.tsx` — `<FormatProvider format="vertical">` + `useFormat()`
  pour que les composants de scène lisent les marges de sécurité et tailles
  de police minimales sans les recevoir en props partout.
- `theme.ts` — polices système (pas de Google Fonts : le fetch réseau vers
  `fonts.gstatic.com` échoue en rendu, la CA du proxy sandbox n'est pas
  approuvée par Chromium) et palette de couleurs neutre par défaut.
- `components/Shared.tsx` — `SceneBackground`, `Kicker`, `Headline`, `Sub`,
  `IconBadge`, `ProgressDots` : les briques déjà éprouvées sur la vidéo
  "Étude de sol", généralisées pour s'adapter à n'importe quel format via
  `useFormat()` au lieu de valeurs 1920px codées en dur.
- `components/Icons.tsx` — jeu d'icônes SVG simples (déjà indépendantes du
  format).

Ces fichiers sont indépendants de `src/` (qui reste le projet Remotion
historique "Étude de sol", non touché). Un nouveau projet importe depuis
`engine/remotion/...` dans son propre dossier `projects/<slug>/`.

## `schema/`

- `sources.schema.json` — un fichier `sources.json` par projet, une entrée
  par image/vidéo externe utilisée dans son `public/`. Objectif :
  traçabilité (URL d'origine, auteur, licence) pour toute ressource qui
  n'est pas produite par nous (photo Unsplash, vidéo stock, etc.).
- `script.schema.json` — le contenu d'une vidéo (découpage en scènes,
  format, texte, référence à un fichier de voix off local).

## Voix off : pas de dépendance TTS obligatoire

Le moteur ne connaît qu'un seul contrat pour la voix off : **un fichier
audio local** posé dans `projects/<slug>/public/audio/` et référencé dans
`script.json` (`voiceover.source = "local-file"`). Que ce fichier vienne
d'un enregistrement, d'ElevenLabs généré à la main, ou d'un autre outil
n'a aucune importance pour le moteur.

Un module TTS optionnel pourra être ajouté plus tard (par exemple
`engine/tts/elevenlabs.ts`) pour remplir automatiquement `voiceover.file` —
il n'existe pas encore et n'est requis par rien ici.

## Manim

Pas de bibliothèque partagée pour l'instant : `manim_diagrams/beam_scene.py`
et un futur script de projet sont chacun autonomes. Si un deuxième script
Manim a besoin des mêmes formes/couleurs, factoriser à ce moment-là dans
`engine/manim/lib/` (dossier volontairement absent tant qu'il n'y a qu'un
seul cas d'usage).

## FFmpeg / faster-whisper / Remotion CLI

Aucun wrapper dans `engine/` : ce sont des binaires système (`ffmpeg`,
`.venv/bin/manim`, `.venv/bin/python`, `npx remotion`) invoqués directement
par les scripts dans `../scripts/`.

### ⚠️ faster-whisper : téléchargement du modèle bloqué dans ce sandbox

`WhisperModel("base", ...)` télécharge les poids CTranslate2 depuis
`huggingface.co` au premier lancement. **Ce domaine est bloqué (403) par la
politique réseau de ce sandbox**, comme `images.unsplash.com`,
`remotion.media` et `download.pytorch.org` avant lui. `scripts/transcribe.py`
est fonctionnel (testé jusqu'au chargement du modèle), mais échouera tant que
le modèle n'est pas déjà présent dans `~/.cache/huggingface`.

Solutions possibles, à faire une fois hors de ce sandbox ou avec une
politique réseau élargie :
- pré-télécharger le modèle ailleurs puis copier `~/.cache/huggingface/hub/`
  dans ce conteneur ;
- demander l'ajout de `huggingface.co` (et `cdn-lfs.huggingface.co`) à la
  liste blanche du proxy.

### ⚠️ `<Video>` dans Remotion : n'utiliser que du WebM/VP9 dans ce sandbox

Le `headless_shell` de Chromium utilisé pour le rendu (`remotion.media` étant
bloqué, voir plus haut) échoue à lire du **H.264/MP4** dans un `<Video>` :
`MediaPlaybackError ... DEMUXER_ERROR_NO_SUPPORTED_STREAMS`. Le ré-encodage en
MP4 avec `+faststart` ne change rien — ce n'est pas un problème de conteneur,
son pipeline média interne ne supporte tout simplement pas ce codec. Un clip
ré-encodé en **VP9/WebM** (`ffmpeg -c:v libvpx-vp9 -b:v 0 -crf 30 ...`) se lit
sans problème. Confirmé avec `projects/beam-reactions-vertical` (asset Manim
converti de `.mp4` en `.webm`).

Conséquence pratique : tout clip vidéo importé dans une composition Remotion
(rendu Manim, clip stock, etc.) doit être livré en `.webm` (VP9) dans
`public/`, pas en `.mp4`, tant que ce rendu passe par `headless_shell`.
