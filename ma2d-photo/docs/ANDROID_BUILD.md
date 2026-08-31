# Générer et tester l'application Android (APK / AAB)

## 0. Prérequis

- Avoir suivi `docs/WINDOWS_SETUP.md` (Node, `npm install`, compte Expo).
- Avoir renseigné `MICROSOFT_CLIENT_ID` dans `app.json` (voir
  `docs/ENTRA_ID_SETUP.md`) — sinon la connexion Microsoft ne fonctionnera
  pas dans le build.

## 1. Configurer EAS Build (une seule fois)

**ACTION À FAIRE**
```powershell
cd ma2d-photo
npx eas login
npx eas build:configure
```
Cela met à jour `app.json` avec un `extra.eas.projectId` réel (remplace le
placeholder `À_RENSEIGNER_APRES_EAS_INIT`).

## 2. Générer un APK installable directement (test interne)

```powershell
npx eas build --platform android --profile preview
```

- Le profil `preview` (voir `eas.json`) produit un **.apk** installable
  directement, sans passer par le Play Store.
- La build s'exécute dans le cloud EAS (gratuit avec limites, ou payant
  selon volume) — aucune compilation Android locale nécessaire.
- À la fin, un lien de téléchargement `.apk` s'affiche dans le terminal et
  sur https://expo.dev (page du projet > Builds).

## 3. Installer l'APK sur un téléphone Android

**ACTION À FAIRE**
1. Sur le téléphone Android, ouvrir le lien de téléchargement (envoyé par
   e-mail, QR code affiché par `eas build`, ou lien direct expo.dev).
2. Télécharger le fichier `.apk`.
3. Si demandé, autoriser **"Installer des applications inconnues"** pour
   l'application utilisée pour télécharger (Chrome, Fichiers, etc.) :
   **Paramètres > Applications > Accès spécial > Installer des
   applications inconnues**.
4. Ouvrir le fichier `.apk` téléchargé > **Installer**.
5. Lancer "MA2D Construction".

## 4. Tester l'application

Suivre le scénario complet dans `docs/TESTING.md` (connexion Microsoft,
sélection Champfleury > Bâtiment A, prise de photo, vérification du nom de
fichier, vérification dans OneDrive, test hors ligne, etc.).

## 5. Générer un AAB pour Google Play (publication future)

```powershell
npx eas build --platform android --profile production
```

- Le profil `production` produit un **.aab** (Android App Bundle), le
  format requis par le Google Play Store (un `.apk` classique n'est plus
  accepté pour une nouvelle publication).

**ACTION À FAIRE** pour publier sur Google Play (optionnel, plus tard) :
1. Créer un compte développeur Google Play (frais unique ~25 USD) :
   https://play.google.com/console/signup
2. Créer une fiche d'application, remplir la politique de confidentialité,
   les captures d'écran, etc. (exigences Google Play standard).
3. Envoyer le `.aab` :
   - Manuellement via la Play Console ("Production" ou "Test interne"), ou
   - Automatiquement avec `npx eas submit --platform android` (nécessite
     une clé de compte de service Google configurée dans `eas.json` >
     `submit.production.android.serviceAccountKeyPath`, voir la doc EAS
     Submit : https://docs.expo.dev/submit/android/).

## Dépannage courant

| Problème | Cause probable |
|---|---|
| Connexion Microsoft ne s'ouvre pas / erreur redirect_uri | `ma2dphoto://auth` non ajouté dans Entra ID (voir ENTRA_ID_SETUP.md) |
| "⚠️ Impossible d'accéder au dossier OneDrive" | Le compte connecté n'a pas accès au dossier, ou le lien n'a pas encore été enregistré dans Administration |
| Build échoue avec une erreur de plugin natif | Vérifier `npx expo-doctor` puis relancer `eas build` |
