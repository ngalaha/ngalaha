# Remotion — "Erreur fatale fondations" (style Kurzgesagt / TED-Ed)

Projet vidéo **100 % programmatique** (React + [Remotion](https://www.remotion.dev/)) :
chaque plan est du SVG/CSS animé image par image (aucune image ou vidéo
statique), synchronisé sur la voix off réelle. Format vertical 1080×1920,
30 fps, prêt pour Facebook/Reels/TikTok/Shorts.

## Générer le MP4 final

```bash
cd remotion
npm install
npm run render
# -> out/erreur_fatale_fondations.mp4
```

C'est la seule commande nécessaire une fois `npm install` fait. Le rendu
utilise un vrai Chromium headless (téléchargé automatiquement par
`@remotion/cli` au premier `npm install`) — il n'y a **aucune clé API, aucun
service payant**. Sur une machine de bureau normale, compter plusieurs
dizaines de minutes pour les ~6 870 frames (le rendu est CPU-bound ; ajustez
`--concurrency` selon vos cœurs).

## Structure du projet

```
remotion/
  package.json            deps (remotion, react) + script "render"
  tsconfig.json
  public/
    audio.mp3              la voix off originale (servie telle quelle par Remotion)
  src/
    index.ts               registerRoot()
    Root.tsx                déclare la composition <MainComposition>, durée = audio
    MainComposition.tsx     assemble les 24 <Sequence> (une par scène) + <Audio>
    scenes.json             24 scènes: {type, start, end, cues, ...contenu}
    theme.ts                couleurs, police, tailles
    components/
      Background.tsx        dégradé + grille SVG (fond commun à toutes les scènes)
      Building.tsx           bâtiment paramétrique SVG (8 "modes" d'animation)
      Caption.tsx             sous-titre bas de plan, synchronisé phrase par phrase
      Icons.tsx               ~24 pictogrammes SVG dessinés à la main
    scenes/
      SceneRenderer.tsx      dispatcher type -> composant
      BuildingScene.tsx, StatementScene.tsx, TitleCardScene.tsx,
      ChecklistScene.tsx, StatsScene.tsx, RulerScene.tsx,
      CostScene.tsx, OutroScene.tsx      (8 gabarits de scène réutilisables)
  script.txt                texte exact de la voix off (fourni par vous)
  align.py                  aligne le texte sur l'audio (silences -> timestamps)
  aligned_sentences.json    sortie de align.py (66 phrases avec start/end)
  build_scenes.py           regroupe les 66 phrases en 24 scènes -> src/scenes.json
```

## Comment fonctionne la synchronisation

Aucun service de transcription (Whisper, ElevenLabs...) n'était disponible
dans cet environnement au moment du montage (quota épuisé / hôtes bloqués).
Le texte exact de la voix off m'a été fourni directement, donc l'étape
manquante n'est pas la transcription mais **l'horodatage** : à quel instant
de l'audio chaque phrase est prononcée.

`align.py` calcule ça sans ASR :

1. `ffmpeg -af silencedetect` repère les silences (pauses entre phrases).
2. Le texte est découpé en phrases et réparti **proportionnellement à leur
   nombre de caractères** sur les intervalles de parole ainsi obtenus.
3. Les timestamps de phrases (`aligned_sentences.json`) sont ensuite groupés
   à la main dans `build_scenes.py` en 24 scènes narratives, chacune avec un
   gabarit visuel adapté à son contenu (bâtiment animé, checklist, stat,
   règle graduée, comparaison de coûts, carte de titre, phrase-choc, outro).

C'est une estimation (pas un alignement mot-à-mot garanti), mais chaque
phrase reste dans la bonne fenêtre de silence détectée, donc le décalage
résiduel est faible (au pire une fraction de seconde), largement dans la
tolérance d'un sous-titre/caption.

## Pourquoi pas de prompts d'images/vidéo IA

Le rendu (SVG + interpolations Remotion) reproduit le style "diagramme
animé qui se dessine" demandé — élément par élément, aucun plan statique —
sans dépendre d'un générateur d'images externe (souvent bloqué ou à quota
limité dans un environnement cloud, et jamais parfaitement cohérent d'une
image à l'autre). C'est ce qui permet un pipeline 100 % local et
reproductible : `npm install && npm run render` suffit, sans clé API.

## Personnalisation

- **Contenu/texte des scènes** : `build_scenes.py` (regénérer avec
  `python3 build_scenes.py` après modification, puis relancer le rendu).
- **Palette / police** : `src/theme.ts`.
- **Animation d'un type de scène** : le fichier correspondant dans
  `src/scenes/`.
- **Le bâtiment** (fissure, affaissement, effondrement, coupe, béton armé,
  vue souterraine) : `src/components/Building.tsx`, prop `mode`.
- **Prévisualisation interactive** (scrub frame par frame avant de relancer
  un rendu complet) : `npx remotion studio src/index.ts`.
