# Installation de l'environnement sur Windows

Ce guide installe tout ce qu'il faut pour développer, tester et générer
(build) l'application MA2D Construction depuis un PC Windows.

## 1. Installer Node.js (LTS)

**ACTION À FAIRE**
1. Aller sur https://nodejs.org
2. Télécharger la version **LTS** (ex : 20.x) pour Windows.
3. Lancer l'installeur, laisser toutes les options par défaut, terminer.
4. Ouvrir "PowerShell" ou "Invite de commandes" et vérifier :
   ```
   node -v
   npm -v
   ```
   Les deux doivent afficher un numéro de version.

## 2. Installer Git

**ACTION À FAIRE**
1. Aller sur https://git-scm.com/download/win
2. Installer avec les options par défaut.
3. Vérifier : `git --version`

## 3. Récupérer le projet

**ACTION À FAIRE**
```powershell
git clone <URL_DU_DEPOT>
cd ma2d-photo
npm install
```

## 4. Installer les outils Expo/EAS (en ligne de commande)

Pas besoin d'installation globale : le projet utilise `npx`, qui télécharge
automatiquement la bonne version à chaque commande. Vous pouvez toutefois
installer l'EAS CLI globalement pour plus de confort :

```powershell
npm install -g eas-cli
eas --version
```

## 5. Créer un compte Expo (gratuit)

**ACTION À FAIRE**
1. Aller sur https://expo.dev/signup
2. Créer un compte (utilisé pour déclencher les builds Android/iOS dans le
   cloud EAS — aucune installation d'Android Studio ou Xcode n'est requise
   pour builder l'application).
3. Dans le dossier du projet :
   ```powershell
   npx eas login
   ```

## 6. Lancer l'application en développement

```powershell
npx expo start
```

- Installez l'application **Expo Go** sur votre téléphone Android/iPhone
  (Play Store / App Store) pour scanner le QR code affiché et tester
  rapidement la navigation entre écrans.
- ⚠️ **La connexion Microsoft ne fonctionne jamais dans Expo Go** (le
  schéma de redirection `ma2dphoto://auth` n'existe que dans une vraie
  build — Expo Go utilise une URI `exp://` temporaire qui ne peut pas être
  enregistrée dans Entra ID). Pour tester l'authentification et l'upload
  OneDrive, générez une **development build** une fois par appareil :
  ```powershell
  npx expo run:android
  ```
  (ou `eas build --profile development` sans PC/câble nécessaire), puis
  relancez `npx expo start` et ouvrez cette build à la place d'Expo Go —
  voir aussi `docs/ENTRA_ID_SETUP.md` et `docs/ANDROID_BUILD.md`.

## 7. (Optionnel) Android Studio pour un émulateur local

Si vous voulez tester sur un émulateur Android sans téléphone physique :

**ACTION À FAIRE**
1. Installer Android Studio : https://developer.android.com/studio
2. Dans Android Studio > Device Manager, créer un appareil virtuel
   (ex : Pixel 6, Android 14).
3. Démarrer l'émulateur, puis :
   ```powershell
   npx expo run:android
   ```

Ceci n'est **pas obligatoire** : EAS Build compile dans le cloud, un
Windows sans Android Studio ni Xcode suffit pour livrer l'application.

## Prochaine étape

→ `docs/ENTRA_ID_SETUP.md` pour créer l'application Microsoft Entra ID et
obtenir le Client ID nécessaire à la connexion Microsoft.
