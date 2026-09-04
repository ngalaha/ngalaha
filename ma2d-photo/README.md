# MA2D Construction — Application mobile de photos de chantier

Application mobile **native** (Android + iOS, un seul code source) qui
permet de prendre une photo de chantier et de l'envoyer automatiquement,
sans aucune manipulation manuelle, dans le bon dossier **Microsoft
OneDrive** :

```
Projet > Bâtiment > Photo > Appartement > Appartement_YYYY-MM-DD_HHmmss_mmm.jpg
Projet > Bâtiment > Photo > YYYY-MM-DD  > YYYY-MM-DD_HHmmss_mmm.jpg   (zone commune)
```

Le dossier de chaque appartement est créé automatiquement dans le dossier
Photo du bâtiment ; seul le lien du dossier Photo se configure à la main.

Fonctionne **hors ligne** : toute photo prise sans connexion est conservée
localement et envoyée automatiquement dès le retour d'Internet, même après
fermeture de l'application ou redémarrage du téléphone.

## Pourquoi React Native + Expo + TypeScript

C'est la technologie demandée en priorité, et elle est objectivement bien
adaptée ici :
- **Un seul code source** pour Android et iOS (exigence du projet).
- **Expo Application Services (EAS)** génère de vraies builds natives
  (APK, AAB, build iOS signée) sans nécessiter Android Studio/Xcode
  installés localement — important pour un poste Windows.
- L'écosystème Expo couvre nativement tous les besoins listés (caméra,
  galerie, fichiers, stockage sécurisé, tâches en arrière-plan,
  notifications) via des modules officiels et maintenus.
- TypeScript apporte la robustesse attendue pour une app utilisée
  quotidiennement sur chantier (types stricts sur les statuts de photo,
  les références OneDrive, etc.).

Aucune alternative (Flutter, apps natives séparées Kotlin/Swift) n'apporte
d'avantage décisif ici et aurait doublé l'effort de maintenance pour un
bénéfice marginal — React Native + Expo reste donc le bon choix.

## Ce qui est déjà construit

- ✅ Architecture complète (voir arborescence ci-dessous), en TypeScript.
- ✅ Authentification Microsoft (Entra ID / MSAL via PKCE, sans secret).
- ✅ Service Microsoft Graph : résolution de lien de partage → Drive
  ID/Item ID, recherche/création du dossier de date, upload (simple et
  par session pour les fichiers volumineux).
- ✅ Base de données locale (SQLite) : projets, bâtiments, file d'attente
  de photos avec statuts.
- ✅ Capture **dans l'application** (photo et vidéo) et import depuis la
  galerie, compression, renommage automatique horodaté à la milliseconde
  — deux photos du même endroit dans la même seconde ne s’écrasent
  jamais.
- ✅ Appartements par bâtiment : saisie en lot avec plages ("101-127"),
  dossier OneDrive de l'appartement créé automatiquement, ou "zone
  commune" quand aucun appartement n'est choisi.
- ✅ File d'attente hors ligne, reprise automatique à la reconnexion, à la
  réouverture de l'app, et en tâche de fond best-effort ; envoi manuel en
  touchant la bannière, réessai ou retrait d'un fichier en échec.
- ✅ Écran principal (sélection projet/bâtiment/appartement, gros bouton
  photo, fichiers récents, bannière "en attente") et menu latéral avec
  l'écran "À propos".
- ✅ **Espace partagé** : un dossier OneDrive commun tient la
  configuration de l'équipe (projets, bâtiments, appartements, liens des
  dossiers Photo). Chaque téléphone la reçoit et y publie ses propres
  ajouts — un seul lien à coller par appareil, aucun serveur. Fusion par
  entité (la plus récente gagne) avec pierres tombales, pour qu'une
  suppression ne soit pas ressuscitée par un téléphone hors ligne.
- ✅ Administration protégée par code PIN (création/suppression de projets,
  bâtiments et appartements, configuration des dossiers OneDrive, statut
  ✓/⚠ par bâtiment, changement du code PIN) + écran de diagnostic
  technique dont le journal peut être partagé.
- ✅ Configuration initiale : Projet Champfleury Phase 1 + Bâtiments A à F
  (liens OneDrive en placeholder — à renseigner, voir plus bas).
- ✅ Documentation complète (ce fichier + `docs/`).

## Ce qu'il reste à faire (ne peut pas être deviné — spec section 38)

| Élément | Où le renseigner | Doc |
|---|---|---|
| `MICROSOFT_CLIENT_ID` | `app.json > expo.extra.microsoftClientId` | `docs/ENTRA_ID_SETUP.md` |
| `MICROSOFT_TENANT_ID` (si single-tenant) | `app.json > expo.extra.microsoftTenantId` | `docs/ENTRA_ID_SETUP.md` |
| Liens OneDrive des Bâtiments A à F | Écran Administration, dans l'app | `docs/ONEDRIVE_SETUP.md` |
| `owner` / `projectId` EAS | `app.json` / `eas.json` (générés par `eas build:configure`) | `docs/ANDROID_BUILD.md` |
| Identifiants Apple Developer | `eas.json > submit.production.ios` | `docs/IOS_BUILD.md` |
| Compte de service Google Play (optionnel) | `eas.json > submit.production.android` | `docs/ANDROID_BUILD.md` |
| Icônes/splash définitifs de MA2D Construction | `assets/*.png` (actuellement des aplats de couleur temporaires) | — |

## Architecture du projet

```
ma2d-photo/
├── App.tsx                     # Point d'entrée : init DB, sync, navigation
├── index.ts
├── app.json / eas.json         # Config Expo / EAS Build
├── src/
│   ├── types/                  # Project, Building, PhotoRecord, statuts...
│   ├── config/                 # seedData (Champfleury A-F), env
│   ├── database/                # SQLite : projectsRepository, photosRepository
│   ├── services/
│   │   ├── microsoftGraph/     # authConfig, authService (PKCE), graphClient,
│   │   │                       # oneDriveService (resolve/ensure/upload)
│   │   ├── upload/             # uploadQueueService, connectivityService,
│   │   │                       # backgroundSyncTask
│   │   ├── storage/            # secureStore, fileStorage, imageProcessing
│   │   └── logging/            # logger technique (écran Diagnostic)
│   ├── hooks/                   # useAuth, useProjects, usePhotoQueue, useConnectivity
│   ├── navigation/               # RootNavigator (React Navigation)
│   ├── screens/                  # Login, Home, Admin*, Diagnostics
│   ├── components/               # BigCameraButton, BuildingGrid, etc.
│   ├── theme/                    # colors, typography
│   └── utils/                    # dateUtils, base64, idUtils, errorMessages
├── assets/                      # icônes/splash (placeholders à remplacer)
└── docs/                        # guides détaillés (voir ci-dessous)
```

## Sécurité (spec section 34)

- Authentification **publique** OAuth2 Authorization Code + PKCE — **aucun
  client secret ni mot de passe** dans le code de l'app.
- Jetons stockés uniquement dans le Keychain/Keystore
  (`expo-secure-store`), jamais en clair.
- Permissions Microsoft Graph **déléguées** uniquement, réduites au
  strict nécessaire : `User.Read`, `Files.ReadWrite.All`,
  `offline_access` — aucune permission d'application. Le variant
  `.All` est imposé par l'endpoint `/shares` utilisé pour résoudre
  les liens de partage (voir `docs/ENTRA_ID_SETUP.md`).
- Toutes les opérations OneDrive respectent les droits réels du compte
  Microsoft connecté — l'app ne contourne aucune permission.

## Démarrage rapide

```bash
npm install
npx expo start
```

Pour une app pleinement fonctionnelle (connexion Microsoft + upload réel),
il faut une vraie build (APK ou build EAS) — voir `docs/ANDROID_BUILD.md`.

## Guide complet, dans l'ordre

1. **Installer l'environnement sur Windows** → `docs/WINDOWS_SETUP.md`
2. **Créer/configurer l'application Microsoft** → `docs/ENTRA_ID_SETUP.md`
3. **Connecter OneDrive** (comprendre le mécanisme) → `docs/ONEDRIVE_SETUP.md`
4. **Renseigner les dossiers Photo A-F** → `docs/ONEDRIVE_SETUP.md` (section 3-4)
5. **Lancer l'application sur Android** (dev) → `docs/WINDOWS_SETUP.md` (section 6)
6. **Générer l'APK** → `docs/ANDROID_BUILD.md` (section 2)
7. **Tester l'application sur Android** → `docs/TESTING.md`
8. **Générer la version iPhone** → `docs/IOS_BUILD.md`
9. **Utiliser TestFlight** → `docs/IOS_BUILD.md` (section 4-5)
10. **Publier éventuellement les deux versions** → `docs/ANDROID_BUILD.md`
    (section 5) et `docs/IOS_BUILD.md` (section 6)

## Ajouter un projet/bâtiment plus tard

L'architecture est générique dès le départ (spec section 4/39) :
- **⚙️ Administration > + Ajouter un projet** crée un nouveau projet vide.
- Dans la fiche du projet, **+ Ajouter un bâtiment** crée un bâtiment sans
  dossier OneDrive, à configurer ensuite avec son lien de partage.
- Modifier/supprimer un projet ou un bâtiment se fait depuis le même écran
  (`Modifier` / `Suppr.`).

Rien de tout cela ne nécessite de nouvelle version de l'app : c'est une
configuration stockée localement (SQLite) sur l'appareil de
l'administrateur.
