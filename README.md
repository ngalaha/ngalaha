# MA2D Photos Chantier

PWA (Progressive Web App) pour la capture et l'archivage automatique des photos de chantier de **MA2D Construction** vers **Microsoft OneDrive**.

- Organisation par **projet** (ex. "Champfleury") contenant plusieurs **bâtiments** (A, B, C…), avec ajout dynamique des deux.
- Pour chaque bâtiment, il suffit de renseigner le lien OneDrive de son dossier **"Photo"**.
- Capture photo (appareil ou galerie) avec renommage automatique `YYYY-MM-DD_HHmmSS.jpg`.
- Envoi automatique dans `Photo/YYYY-MM-DD/` du bâtiment sélectionné (création du sous-dossier du jour si besoin).
- File d'envoi persistante (IndexedDB) : les photos prises hors réseau sont mises en cache et envoyées automatiquement au retour de la connexion.
- Installable sur mobile (PWA), interface tactile pensée pour le terrain.

## Stack technique

- **React 19 + Vite** — SPA sans rechargement de page.
- **Tailwind CSS v4** — UI mobile-first, gros boutons, forte lisibilité.
- **Framer Motion** — animations et transitions fluides.
- **Zustand** — état global (projets, bâtiments, authentification, file d'envoi).
- **idb** (IndexedDB) — cache local des photos en attente d'envoi.
- **vite-plugin-pwa** — manifest, service worker, installabilité.
- **MSAL.js (@azure/msal-browser) + Microsoft Graph API** — authentification Microsoft et upload OneDrive (upload en session, avec suivi de progression).

## 1. Configuration Microsoft Entra ID (accès OneDrive)

L'application appelle Microsoft Graph directement depuis le navigateur (aucun backend requis). Il faut inscrire une application dans Microsoft Entra ID (anciennement Azure AD) :

1. Allez sur [portal.azure.com](https://portal.azure.com/) → **Microsoft Entra ID → Inscriptions d'applications → Nouvelle inscription**.
2. Nom : `MA2D Photos Chantier`.
3. **Types de comptes pris en charge** : choisissez *"Comptes dans n'importe quel annuaire organisationnel et comptes Microsoft personnels"* si des chantiers utilisent des comptes OneDrive personnels, sinon *"Comptes de cet annuaire organisationnel uniquement"* (recommandé si tout le monde utilise un compte MA2D Microsoft 365 / SharePoint).
4. **URI de redirection** : type **Application monopage (SPA)**, valeur = l'URL de dev (`http://localhost:5173`) puis, une fois déployé, l'URL de production (ex. `https://photos.ma2d-construction.fr`). Vous pouvez ajouter plusieurs URI.
5. Une fois créée, copiez l'**ID d'application (client)** affiché sur la page *Vue d'ensemble*.
6. **API permissions** → *Add a permission* → **Microsoft Graph → Delegated permissions** → ajoutez `Files.ReadWrite` et `User.Read` (généralement déjà présents par défaut). Si le tenant est organisationnel et exige un consentement admin, cliquez sur **Grant admin consent**.
7. (Optionnel) Si vous voulez restreindre l'app au seul tenant MA2D plutôt qu'accepter tout compte Microsoft, notez l'**ID de locataire (tenant)** sur la page *Vue d'ensemble* — vous le renseignerez dans `.env`.

## 2. Installation du projet

```bash
npm install
cp .env.example .env
```

Éditez `.env` et renseignez votre identifiant :

```bash
VITE_MS_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_MS_TENANT_ID=common   # ou l'ID de votre tenant MA2D pour restreindre l'accès
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
- **Azure Static Web Apps**, **Cloudflare Pages**, ou tout hébergeur statique HTTPS conviennent également.

⚠️ Pensez à ajouter l'URL de production dans les **URI de redirection SPA** de l'inscription d'application (étape 1).

## 6. Utilisation

1. Ouvrez l'app et cliquez sur **Connexion Microsoft** (autorise l'accès à OneDrive).
2. Le projet **Champfleury** est créé par défaut. Vous pouvez créer d'autres projets via **"Nouveau projet"** (chaque projet regroupe ses propres bâtiments).
3. Ajoutez un bâtiment au projet sélectionné : nom (ex. "Bâtiment A") + **lien OneDrive du dossier "Photo"** de ce bâtiment (copié depuis OneDrive/SharePoint via *Partager → Copier le lien*, en s'assurant que le compte connecté a accès à ce dossier).
4. Sélectionnez le bâtiment, appuyez sur **Prendre une photo** (ou **Importer depuis la galerie**).
5. La photo est renommée automatiquement puis envoyée dans `Photo/AAAA-MM-JJ/` du bâtiment. Une notification confirme le succès ou l'échec.
6. Icône en haut à droite (📥) : ouvre la **file d'envoi** — visualisez les photos en attente/en erreur, relancez ou supprimez un envoi.
7. Hors connexion : les photos restent stockées localement (IndexedDB) et sont envoyées automatiquement dès le retour du réseau.

### Installer l'app sur mobile (PWA)

- **Android/Chrome** : menu ⋮ → "Ajouter à l'écran d'accueil" (ou bannière d'installation automatique).
- **iOS/Safari** : bouton Partager → "Sur l'écran d'accueil".

## Structure du projet

```
src/
  components/        UI (sélecteurs de projet/bâtiment, capture, file d'envoi, notifications…)
  services/
    msAuth.js          Authentification Microsoft (MSAL.js)
    oneDrive.js         Appels Microsoft Graph (résolution de lien, dossiers, upload)
    uploadQueue.js       Persistance IndexedDB de la file d'envoi
  store/
    useAppStore.js         État global Zustand (projets, bâtiments, auth, file d'envoi, notifications)
  utils/
    filename.js               Formatage des noms de fichiers/dossiers (YYYY-MM-DD[_HHmmSS])
public/icons/         Icônes PWA (à remplacer par le logo officiel MA2D avant mise en prod)
```

## Notes & limites connues

- Le lien du dossier "Photo" doit être un lien de **partage OneDrive/SharePoint** accessible par le compte Microsoft connecté (propriétaire du dossier, ou dossier partagé avec ce compte). L'app le résout via l'API Graph `/shares` en un `driveId`/`itemId`, ce qui fonctionne aussi bien pour un OneDrive personnel que pour OneDrive Entreprise / SharePoint.
- L'ajout d'un bâtiment nécessite d'être connecté (la vérification du dossier se fait immédiatement lors de l'ajout).
- Les icônes fournies dans `public/icons/` sont des placeholders générés automatiquement : remplacez-les par le logo MA2D Construction (192×192, 512×512, et une version *maskable*) avant la mise en production.
- Le jeton d'accès Microsoft est géré et renouvelé automatiquement par MSAL (silencieusement en arrière-plan) ; si le renouvellement silencieux échoue (session expirée côté Microsoft), l'utilisateur doit se reconnecter via le bouton "Connexion Microsoft".
- L'envoi "en arrière-plan" fonctionne tant que l'app reste ouverte (onglet actif ou en arrière-plan) : la file d'attente IndexedDB est traitée automatiquement dès que le réseau revient (écouteur `online`), sans bloquer l'interface ni recharger la page. Si l'app est totalement fermée pendant une coupure réseau, l'envoi reprendra à sa prochaine ouverture.
