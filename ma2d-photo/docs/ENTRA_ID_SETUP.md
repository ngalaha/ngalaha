# Créer l'application Microsoft Entra ID (authentification + OneDrive)

L'application mobile ne contient **aucun secret** : elle s'authentifie comme
une "application publique" (public client) avec le flux **Authorization
Code + PKCE**. Vous devez créer un enregistrement d'application dans
Microsoft Entra ID (anciennement Azure AD) pour obtenir un **Client ID**.

## 1. Créer l'enregistrement d'application

**ACTION À FAIRE**
1. Aller sur https://entra.microsoft.com (ou https://portal.azure.com puis
   chercher "Microsoft Entra ID").
2. Menu de gauche : **Identité** > **Applications** > **Inscriptions
   d'applications** ("App registrations").
3. Cliquer **Nouvelle inscription** ("New registration").
4. Renseigner :
   - **Nom** : `MA2D Construction - Photos`
   - **Types de comptes pris en charge** : choisir selon votre organisation
     — en général *"Comptes dans cet annuaire organisationnel
     uniquement"* (single-tenant) pour une entreprise MA2D Construction.
   - **URI de redirection** : laisser vide pour l'instant, on l'ajoute à
     l'étape suivante avec le bon type de plateforme.
5. Cliquer **S'inscrire** ("Register").
6. Sur la page de l'application, noter :
   - **Application (client) ID** → à copier dans `app.json` /
     variable `MICROSOFT_CLIENT_ID`.
   - **Directory (tenant) ID** → si vous utilisez "single-tenant", copier
     cette valeur dans `MICROSOFT_TENANT_ID` (sinon laisser `common`).

## 2. Ajouter la plateforme "Mobile et applications de bureau"

**ACTION À FAIRE**
1. Dans le menu de gauche de l'application : **Authentification**.
2. Cliquer **Ajouter une plateforme** > **Applications mobiles et de
   bureau**.
3. Ajouter l'URI de redirection suivante :
   - `ma2dphoto://auth`
   ⚠️ N'ajoutez PAS d'URI `https://auth.expo.io/...` : ce service proxy
   Expo est obsolète et n'est plus utilisé par la version d'Expo Auth
   Session de ce projet. **La connexion Microsoft ne fonctionne pas dans
   l'application Expo Go** (elle génère une URI de redirection `exp://`
   locale, instable, qui ne peut pas être enregistrée ici). Pour tester
   l'authentification, utilisez toujours une **development build**
   (`npx expo run:android` / `eas build --profile development`) ou une
   vraie build — voir `docs/WINDOWS_SETUP.md` section 6.
4. Descendre jusqu'à **Paramètres avancés** et activer :
   **"Autoriser les flux clients publics"** (*Allow public client flows*)
   → **Oui**. C'est indispensable : sans secret, l'app doit être déclarée
   comme cliente publique.
5. Cliquer **Enregistrer**.

## 3. Configurer les permissions Microsoft Graph (minimum nécessaire)

**ACTION À FAIRE**
1. Menu de gauche : **Autorisations API** ("API permissions").
2. Cliquer **Ajouter une autorisation** > **Microsoft Graph** >
   **Autorisations déléguées** ("Delegated permissions").
3. Ajouter :
   - `User.Read` (généralement déjà présent par défaut)
   - `Files.ReadWrite.All` (créer/lire/écrire des fichiers dans les
     dossiers OneDrive auxquels l'utilisateur a accès, **y compris les
     dossiers partagés avec lui** — voir l'encadré ci-dessous)
   - `offline_access` (permet le renouvellement silencieux de session,
     pour ne pas redemander la connexion à chaque ouverture)
4. Si votre organisation l'exige, cliquer **Accorder un consentement
   d'administrateur** ("Grant admin consent").

### Pourquoi `Files.ReadWrite.All` et pas `Files.ReadWrite`

L'app atteint le dossier Photo de chaque bâtiment à partir de son **lien
de partage**, résolu par `GET /shares/{id}/driveItem`. Microsoft Graph
n'autorise cet endpoint qu'avec la variante `.All` : avec
`Files.ReadWrite` seul, l'app ne voit que le OneDrive personnel de
l'utilisateur et échoue en **403 sur tout dossier partagé par
l'entreprise** — c'est-à-dire sur l'usage même pour lequel elle existe.

Le moindre privilège est préservé par le fait que la permission est
**déléguée**, jamais applicative :

- ❌ Aucune permission d'application ("Application permissions") : l'app
  n'a aucun accès autonome au tenant, elle ne peut rien faire sans qu'un
  employé soit connecté.
- ✅ Elle n'atteint jamais plus que ce que la personne connectée peut
  déjà ouvrir elle-même dans OneDrive.
- ✅ Elle n'écrit que dans les dossiers dont le lien de partage a été
  explicitement configuré dans l'Administration de l'app.
- ✅ Le consentement est révocable en tout temps depuis Entra ID >
  Applications d'entreprise.

Si l'organisation exige un périmètre plus étroit qu'un scope délégué,
la seule alternative Graph est `Sites.Selected` (permission applicative
restreinte à un site SharePoint précis), qui impose un composant serveur
détenant un secret client — hors de portée d'une app mobile publique.

## 4. Renseigner le Client ID dans l'application

**ACTION À FAIRE** — Éditer `ma2d-photo/app.json` :

```json
"extra": {
  "microsoftClientId": "COLLER_ICI_L_APPLICATION_CLIENT_ID",
  "microsoftTenantId": "COLLER_ICI_LE_TENANT_ID_OU_common"
}
```

Ne jamais commiter de vraie valeur dans un dépôt public si l'organisation
préfère la garder privée — ces valeurs restent toutefois "publiques" au
sens OAuth (un Client ID d'app publique n'est pas un secret), contrairement
à un mot de passe ou un client secret qui ne doivent, eux, jamais exister
dans ce projet.

## 5. Résumé sécurité (spec section 34)

- ❌ Pas de mot de passe stocké dans l'app.
- ❌ Pas de "client secret" (réservé aux apps serveur — jamais dans un
  mobile).
- ❌ Pas de token permanent : les jetons sont stockés uniquement dans le
  Keychain (iOS) / Keystore (Android) via `expo-secure-store`, avec
  renouvellement silencieux (`offline_access`) et expiration gérée par
  Microsoft.
- ✅ Permissions Graph **déléguées** uniquement, limitées à
  `User.Read`, `Files.ReadWrite.All`, `offline_access` — aucune
  permission d'application.

## Prochaine étape

→ `docs/ONEDRIVE_SETUP.md` pour créer les dossiers Photo de chaque
bâtiment et obtenir leurs liens de partage.
