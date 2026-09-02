# Bâti Facile

Application mobile de calcul de matériaux de construction pour l'Afrique centrale et
de l'Ouest (Cameroun, Gabon, Congo-Brazzaville, RDC, Côte d'Ivoire) — **système
métrique uniquement**, entièrement hors ligne.

Développée avec React Native + Expo + TypeScript, même stack et mêmes principes que
l'application sœur *Calcul Chantier* (Québec), mais **produit séparé** : catalogue de
matériaux, moteur de calcul et interface propres à ce marché.

## État actuel — Phase 1 : le moteur "Parpaings"

Le cœur du produit est implémenté et testé : calcul du nombre de blocs (parpaings)
nécessaires pour construire des murs, en respectant les pratiques de maçonnerie
courantes en Afrique centrale/de l'Ouest.

```
src/
├── calculationEngine/
│   ├── blocks.ts     Calcul des blocs par mur (surface nette, blocs/m², agrégation multi-murs)
│   ├── mortar.ts     Mortier de pose (ciment/sable) + enduit (crépi)
│   ├── bourrage.ts   Béton de remplissage des alvéoles (murs bourrés, ciment/sable/gravier)
│   ├── quantity.ts   Marge de casse + arrondi de commande (exact / avec marge / recommandé)
│   ├── units.ts       Conversions métriques exactes (m, cm, mm)
│   └── format.ts     Arrondi et formatage — uniquement à l'affichage
├── materials/
│   └── blocks.ts     Catalogue des formats de blocs (10x20x40, 15x20x40, 20x20x40)
└── models/
    └── Wall.ts        Modèle Mur (dont `bourre: boolean`) + Ouverture (porte/fenêtre)

tests/                 38 tests automatisés (Jest) sur le moteur de calcul
```

### Principe du moteur Parpaings

1. **Un bloc par niveau, suggéré mais modifiable** : 20×20×40 ou 15×20×40 pour le
   soubassement/fondation, 15×20×40 pour l'élévation, 10×20×40 pour les cloisons
   légères. Le **bourrage** (remplissage des alvéoles au béton) est une propriété du
   **mur** (`Wall.bourre`), pas du format de bloc — un même format peut être posé
   bourré ou non selon l'usage.
2. **Surface nette** = surface brute du mur (longueur × hauteur) − surface des
   ouvertures (portes, fenêtres, avec quantités).
3. **Blocs par m²** dérivé du format du bloc + épaisseur de joint (défaut 1,5 cm,
   ajustable).
4. **Agrégation multi-murs**, groupée par format de bloc utilisé.
5. **Marge de casse et arrondi de commande** appliqués une seule fois, au niveau de
   l'agrégat — jamais mur par mur — pour ne pas accumuler d'arrondis.
6. **Mortier de pose (élévation, non bourré)** : ratio **terrain confirmé** — 1 sac
   de ciment (50 kg) monte 140 parpaings de 15×20×40, avec 3 brouettes de sable par
   sac. C'est la méthode de référence pour ce format ; les autres formats sans ratio
   confirmé retombent sur une estimation volumétrique (clairement signalée comme
   telle).
7. **Bourrage (soubassement/fondation)** : volume de béton = volume brut du bloc ×
   taux de vide (55 % par défaut, plage 50-60 % selon NF EN 771-3 — estimation à
   confirmer sur le terrain, pas un ratio validé comme celui du ciment de pose),
   puis dosage béton "350" (350 kg/m³ ciment, 0,5 m³/m³ sable, 0,7 m³/m³ gravier)
   pour obtenir ciment/sable/gravier.
8. **Enduit** calculé à partir de la surface et d'une épaisseur choisie, dosage
   ciment/sable standard.

Toutes les valeurs intermédiaires restent exactes (précision double) ; seul
l'affichage/la commande finale arrondit.

### Hypothèses à valider sur le terrain

Deux ratios sont **confirmés terrain** (140 blocs/sac de ciment, 3 brouettes de
sable/sac) et font foi. Tout le reste (taux de vide du bourrage 55 %, dosages
béton/mortier, volume de brouette 65 L) est une estimation standard documentée dans
le code — à corriger dès que des chiffres terrain plus précis sont disponibles.

## Fonctionnalités livrées

- **Phase 1** — Moteur de calcul (blocs, mortier de pose, bourrage, enduit).
- **Phase 2** — Écrans : Accueil, Projets, Murs, Devis (export PDF avec infos
  client/chantier), Paramètres. Stockage 100 % hors ligne.
- **Phase 3** — Relevé assisté sur plan (`src/screens/PlanScreen.tsx`) :
  1. Téléverser une photo (galerie ou appareil photo, `expo-image-picker`) **ou un
     PDF** (`expo-document-picker` + `@dariyd/react-native-pdf-page-image`, rendu de
     la page choisie en image — sélecteur de page pour les PDF multi-pages).
  2. Calibrer l'échelle en glissant le doigt le long d'une cote connue et en indiquant
     sa distance réelle.
  3. Tracer chaque mur en glissant le doigt d'un point à l'autre (comme un outil de
     dessin de ligne) — sa longueur réelle est calculée automatiquement (ratio pixels
     ↔ mètres de l'étape de calibrage, indépendant de la résolution/du zoom utilisés).
  4. Zoom (100 à 300 %) avec un mode Déplacer/Dessiner dédié pour naviguer sur
     l'image sans déclencher de tracé par erreur, utile pour les plans très détaillés.
  5. Réglages communs (niveau, format de bloc, hauteur, joint, bourrage) appliqués à
     tous les murs tracés, puis création en un clic.

  Limites connues de cette V1 : murs tracés en ligne droite (pas d'angles complexes
  en un seul tracé), pas d'ouvertures ajoutées depuis cet écran (à ajouter ensuite
  via "Murs" si besoin — l'édition d'un mur existant n'est pas encore possible, il
  faut le supprimer et le recréer).

## Prochaines étapes

- **Phase 4** : système d'activation payant via Mobile Money, publication Play Store.
- Édition d'un mur existant (actuellement : suppression + recréation uniquement).
- Reconnaissance automatique assistée par IA du tracé (pré-détection des murs à
  valider par l'utilisateur), en complément du tracé manuel.

## Développement local

```bash
npm install
npm test          # suite de tests du moteur de calcul
npm run start      # Metro / Expo Dev Tools
```
