# MA2D Photos Chantier

PWA (Progressive Web App) pour la capture et l'archivage automatique des photos de chantier de **MA2D Construction** vers Google Drive.

- Sélection dynamique du bâtiment (ajout à la volée, associé à un dossier Google Drive).
- Capture photo (appareil ou galerie) avec renommage automatique `YYYY-MM-DD_HHmmSS.jpg`.
- Envoi automatique dans `Bâtiment/Photo/YYYY-MM-DD/` sur Google Drive (création des sous-dossiers si besoin).
- File d'envoi persistante (IndexedDB) : les photos prises hors réseau sont mises en cache et envoyées automatiquement au retour de la connexion.
- Installable sur mobile (PWA), interface tactile pensée pour le terrain.

## Stack technique

- **React 19 + Vite** — SPA sans rechargement de page.
- **Tailwind CSS v4** — UI mobile-first, gros boutons, forte lisibilité.
- **Framer Motion** — animations et transitions fluides.
- **Zustand** — état global (bâtiments, authentification, file d'envoi).
- **idb** (IndexedDB) — cache local des photos en attente d'envoi.
- **vite-plugin-pwa** — manifest, service worker, installabilité.
- **Google Identity Services + Drive API v3** — authentification OAuth et upload (upload resumable, avec suivi de progression).

## 1. Configuration Google Cloud (API Drive)

L'application appelle l'API Google Drive directement depuis le navigateur (aucun backend requis). Il faut créer un identifiant OAuth côté Google Cloud :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/) et créez (ou sélectionnez) un projet, par ex. `ma2d-photos-chantier`.
2. **APIs & Services → Library** : activez **Google Drive API**.
3. **APIs & Services → OAuth consent screen** :
   - Type : *Internal* si vous utilisez un Google Workspace MA2D, sinon *External*.
   - Renseignez le nom de l'app, logo (optionnel), email de support.
   - Scopes : ajoutez `https://www.googleapis.com/auth/drive` (accès complet, nécessaire pour parcourir/créer des sous-dossiers dans des dossiers existants).
   - Si *External* + mode *Testing* : ajoutez les comptes Google des utilisateurs (chefs de chantier) dans **Test users**, sinon Google bloquera la connexion.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** :
   - Type d'application : **Application Web**.
   - **Authorized JavaScript origins** : ajoutez l'URL de dev (`http://localhost:5173`) et l'URL de production (ex. `https://photos.ma2d-construction.fr`).
   - Pas besoin de "Authorized redirect URIs" (flux token client, pas de redirection).
   - Copiez le **Client ID** généré (`....apps.googleusercontent.com`).

## 2. Installation du projet

```bash
npm install
cp .env.example .env
```

Éditez `.env` et renseignez votre identifiant :

```bash
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

## 3. Lancer en développement

```bash
npm run dev
```

Ouvrez `http://localhost:5173`. Sur mobile, utilisez le même réseau Wi-Fi et l'IP affichée par Vite (`npm run dev -- --host`), ou déployez (voir ci-dessous) pour tester la capture caméra en HTTPS (requis par les navigateurs mobiles).

## 4. Build de production

```bash
npm run build
npm run preview   # pour vérifier le build localement
```

Le résultat est généré dans `dist/` (fichiers statiques + service worker).

## 5. Déploiement rapide

L'application est 100% statique (aucun serveur applicatif requis). Déployez `dist/` sur :

- **Vercel** : `npx vercel --prod` (ou connecter le repo Git, build command `npm run build`, output `dist`).
- **Netlify** : `npx netlify deploy --prod --dir dist` (ou build command `npm run build`, publish directory `dist`).
- **Firebase Hosting**, **Cloudflare Pages**, ou tout hébergeur statique HTTPS conviennent également.

⚠️ Pensez à ajouter l'URL de production dans **Authorized JavaScript origins** (étape 1) et, si le consent screen est en mode *Testing*, à ajouter les utilisateurs concernés.

## 6. Utilisation

1. Ouvrez l'app et cliquez sur **Connexion Google** (autorise l'accès à Drive).
2. Ajoutez un bâtiment : nom + URL ou ID du dossier Google Drive parent (ex. `https://drive.google.com/drive/folders/1AbC...` ou juste l'ID).
3. Sélectionnez le bâtiment, appuyez sur **Prendre une photo** (ou **Importer depuis la galerie**).
4. La photo est renommée automatiquement puis envoyée dans `Bâtiment/Photo/AAAA-MM-JJ/` sur Drive. Une notification confirme le succès ou l'échec.
5. Icône en haut à droite (📥) : ouvre la **file d'envoi** — visualisez les photos en attente/en erreur, relancez ou supprimez un envoi.
6. Hors connexion : les photos restent stockées localement (IndexedDB) et sont envoyées automatiquement dès le retour du réseau.

### Installer l'app sur mobile (PWA)

- **Android/Chrome** : menu ⋮ → "Ajouter à l'écran d'accueil" (ou bannière d'installation automatique).
- **iOS/Safari** : bouton Partager → "Sur l'écran d'accueil".

## Structure du projet

```
src/
  components/        UI (sélecteur de bâtiment, capture, file d'envoi, notifications…)
  services/
    googleAuth.js     Authentification OAuth (Google Identity Services)
    googleDrive.js     Appels API Drive (dossiers, upload resumable)
    uploadQueue.js      Persistance IndexedDB de la file d'envoi
  store/
    useAppStore.js       État global Zustand (bâtiments, auth, file d'envoi, notifications)
  utils/
    filename.js           Formatage des noms de fichiers/dossiers (YYYY-MM-DD[_HHmmSS])
public/icons/         Icônes PWA (à remplacer par le logo officiel MA2D avant mise en prod)
```

## Notes & limites connues

- Le scope Drive utilisé (`.../auth/drive`) donne un accès large au compte Google connecté, nécessaire pour atteindre des dossiers déjà existants fournis par ID/URL. Utilisez de préférence un compte de service dédié ("Chantier MA2D") plutôt qu'un compte personnel.
- Les icônes fournies dans `public/icons/` sont des placeholders générés automatiquement : remplacez-les par le logo MA2D Construction (192×192, 512×512, et une version *maskable*) avant la mise en production.
- Le jeton d'accès Google expire après ~1h ; l'utilisateur doit alors se reconnecter (bouton "Connexion Google") pour que la file d'envoi reprenne.
- L'envoi "en arrière-plan" fonctionne tant que l'app reste ouverte (onglet actif ou en arrière-plan) : la file d'attente IndexedDB est traitée automatiquement dès que le réseau revient (écouteur `online`), sans bloquer l'interface ni recharger la page. Si l'app est totalement fermée pendant une coupure réseau, l'envoi reprendra à sa prochaine ouverture — la véritable Background Sync API (upload même app fermée) nécessiterait un service worker personnalisé (`injectManifest`), non activé par défaut ici.
