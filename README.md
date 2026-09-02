# Calcul Chantier

Application mobile professionnelle (Android, avec architecture prête pour iOS) qui calcule les quantités de matériaux de construction — béton, panneaux, conversions — à partir de mesures en pieds et pouces, et prépare des listes de commande fiables.

Développée avec **React Native + Expo + TypeScript**, entièrement fonctionnelle hors ligne.

## Priorités

1. **Exactitude mathématique** — aucune valeur intermédiaire n'est arrondie ; l'arrondi n'intervient qu'à l'affichage.
2. **Fiabilité** — validation des entrées, gestion d'erreurs complète, aucune connexion Internet requise.
3. **Rapidité** — calculs instantanés.
4. **Intuitivité** — saisie pieds/pouces intelligente, mode Chantier.
5. **Esthétique** — design moderne, mode clair/sombre.

## Architecture

```
src/
├── calculationEngine/   Moteur de calcul pur, indépendant de l'UI (conversions, béton,
│                         panneaux, surfaces, calcul rapide, formatage/arrondi)
├── models/               Types des entités (Project, ConcreteElement, PanelElement, Order)
├── materials/            Données de référence (catalogues panneaux/béton, marges par défaut)
├── storage/               Persistance locale hors ligne (AsyncStorage) : projets, historique, favoris, commandes
├── export/               Génération PDF / CSV et partage Android
├── settings/             Préférences utilisateur persistées (thème, mode chantier)
├── styles/               Thème (couleurs clair/sombre), typographie, espacement
├── components/           Composants réutilisables (Card, Button, MeasurementField, Pill, Screen)
├── screens/               Écrans de l'application
└── navigation/            React Navigation (stack + types)

tests/                    Tests automatisés (Jest) du moteur de calcul
```

Le moteur de calcul (`src/calculationEngine`) ne dépend d'aucun composant React Native : il est
directement réutilisable pour une future version iOS ou pour du code partagé.

## Développement local

```bash
npm install
npm run start        # Metro / Expo Dev Tools
npm run android       # build + installation sur un appareil/émulateur Android connecté
```

## Tests automatisés

```bash
npm test
```

50+ tests couvrent les conversions exactes, le parseur de mesures pieds/pouces, les 20 types
d'éléments béton, le calculateur de panneaux et le calcul rapide (cas valides et entrées invalides).

## Génération de l'APK / AAB

Le projet est en **workflow managé Expo** (aucun dossier `android/` n'est versionné — il est généré
à la demande). Deux méthodes sont possibles :

### Option A — Build local (nécessite Android Studio / SDK Android + JDK 17+)

```bash
npx expo prebuild --platform android   # génère le dossier android/
cd android
./gradlew assembleRelease               # APK -> android/app/build/outputs/apk/release/
./gradlew bundleRelease                 # AAB -> android/app/build/outputs/bundle/release/
```

Pour un test rapide sur un appareil branché en USB (debug, non signé release) :

```bash
npm run android
```

### Option B — EAS Build (cloud, recommandé, ne nécessite pas d'Android Studio)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview      # génère un APK installable
eas build --platform android --profile production   # génère un AAB pour le Play Store
```

Les profils sont définis dans `eas.json` :
- `development` — client de développement
- `preview` — APK signé, installation directe sur appareil
- `production` — AAB signé, prêt pour publication

> Remarque : la génération d'un APK/AAB nécessite un environnement avec le SDK Android (Option A)
> ou un accès aux serveurs de build EAS (Option B). Ces deux prérequis n'étaient pas disponibles
> dans l'environnement d'exécution distant utilisé pour développer cette application ; le code,
> la configuration (`app.json`, `eas.json`) et `npx expo prebuild` ont été validés, mais la
> génération du binaire final doit être effectuée dans l'un de ces deux environnements.

## Vers iOS

L'architecture (moteur de calcul, stockage, modèles) est déjà indépendante de la plateforme.
Pour produire une version iPhone :
1. `npx expo prebuild --platform ios` (nécessite macOS + Xcode) ou `eas build --platform ios`.
2. Aucune modification du moteur de calcul, du stockage ou des modèles n'est requise.
3. Adapter au besoin les styles spécifiques à la plateforme dans `src/styles`.
