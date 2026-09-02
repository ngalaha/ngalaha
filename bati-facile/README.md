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
│   ├── mortar.ts     Mortier de pose + enduit (crépi) : ciment, sable
│   ├── quantity.ts   Marge de casse + arrondi de commande (exact / avec marge / recommandé)
│   ├── units.ts       Conversions métriques exactes (m, cm, mm)
│   └── format.ts     Arrondi et formatage — uniquement à l'affichage
├── materials/
│   └── blocks.ts     Catalogue des formats de blocs (10x20x40, 15x20x40, 20x20x40)
└── models/
    └── Wall.ts        Modèle Mur + Ouverture (porte/fenêtre)

tests/                 25 tests automatisés (Jest) sur le moteur de calcul
```

### Principe du moteur Parpaings

1. **Un bloc par niveau, suggéré mais modifiable** : 20×20×40 pour le soubassement/
   fondation (portance, étanchéité), 15×20×40 pour l'élévation (murs porteurs),
   10×20×40 pour les cloisons légères.
2. **Surface nette** = surface brute du mur (longueur × hauteur) − surface des
   ouvertures (portes, fenêtres, avec quantités).
3. **Blocs par m²** dérivé du format du bloc + épaisseur de joint (défaut 1,5 cm,
   ajustable).
4. **Agrégation multi-murs**, groupée par format de bloc utilisé (ex: total blocs
   20×20×40 pour tout le soubassement + total blocs 15×20×40 pour toute l'élévation).
5. **Marge de casse et arrondi de commande** appliqués une seule fois, au niveau de
   l'agrégat — jamais mur par mur — pour ne pas accumuler d'arrondis.
6. **Mortier de pose et enduit** calculés à partir de la surface nette et de ratios de
   dosage standards (ciment/sable), ajustables.

Toutes les valeurs intermédiaires restent exactes (précision double) ; seul
l'affichage/la commande finale arrondit.

## Prochaines étapes

- **Phase 2** : écrans (saisie des murs, projets, export PDF de devis quantitatif) —
  réutilise les patterns déjà validés dans *Calcul Chantier*.
- **Phase 3** : relevé assisté sur plan de distribution téléversé.
- **Phase 4** : système d'activation payant via Mobile Money, publication Play Store.

## Développement local

```bash
npm install
npm test          # suite de tests du moteur de calcul
npm run start      # Metro / Expo Dev Tools
```
