# Projects

Un dossier par vidéo produite. Chaque projet est autonome : son contenu
(script, assets, sorties) vit ici ; le code réutilisable vient de
`../engine/`.

## Convention de dossier

```
projects/<slug>/
├── project.json          # slug, titre, format, état (voir _template)
├── script.json            # découpage en scènes (engine/schema/script.schema.json)
├── sources.json             # traçabilité des images/vidéos externes (engine/schema/sources.schema.json)
├── manim/                     # scripts Manim propres à ce projet (optionnel)
├── public/                     # tout ce que Remotion doit pouvoir servir en staticFile()
│   ├── audio/                    # voix off — fichiers locaux (jamais généré par le moteur)
│   ├── captions/                   # .srt produits par scripts/transcribe.py
│   ├── images/                       # images (renseigner sources.json si externes)
│   └── manim-render/                   # sorties de manim/ (regénérables, non versionnées)
└── render/                                # sortie finale (regénérable, non versionnée)
```

Au rendu, on passe `--public-dir projects/<slug>/public` à Remotion pour que
chaque projet reste isolé des autres (pas de `public/` racine partagé).

## Créer un nouveau projet

```bash
scripts/new-project.sh <slug> "Titre de la vidéo" [vertical|landscape]
```

Ça copie `_template/` vers `projects/<slug>/` avec le format demandé
(`vertical` par défaut — 1080×1920 pour Facebook/Reels).

## Projets existants

- **`etude-de-sol/`** — la vidéo "étude de sol avant construction" produite
  avant que ce moteur existe. Son code vit toujours dans `../src/` (composition
  Remotion historique, 16:9) ; `project.json` ici ne fait que documenter où
  la trouver, rien n'a été déplacé.
- **`beam-reactions-demo/`** — le diagramme Manim de la poutre sur deux
  appuis. Son script et son rendu vivent toujours dans
  `../manim_diagrams/` ; `project.json` ici documente l'emplacement.

Ces deux projets ne suivent pas encore la convention de dossier ci-dessus ;
les migrer physiquement est un choix à faire plus tard, pas fait
automatiquement pour ne rien casser.
