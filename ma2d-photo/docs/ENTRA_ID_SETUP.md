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
3. Cocher/ajouter les URI de redirection suivantes :
   - `ma2dphoto://auth` (utilisée par les vraies builds Android/iOS)
   - `https://auth.expo.io/@VOTRE_COMPTE_EXPO/ma2d-photo` (utile pour les
     tests via l'application **Expo Go** en développement — remplacez
     `VOTRE_COMPTE_EXPO` par votre nom d'utilisateur Expo)
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
   - `Files.ReadWrite` (créer/lire/écrire des fichiers dans les dossiers
     OneDrive auxquels l'utilisateur a accès)
   - `offline_access` (permet le renouvellement silencieux de session,
     pour ne pas redemander la connexion à chaque ouverture)
4. Si votre organisation l'exige, cliquer **Accorder un consentement
   d'administrateur** ("Grant admin consent").

⚠️ Ne demandez **jamais** `Files.ReadWrite.All` ou des permissions
d'application ("Application permissions") pour cette app mobile : cela
dépasserait le principe du moindre privilège demandé (spec section 8/34).
`Files.ReadWrite` (délégué) suffit : l'app agit avec les droits du compte
Microsoft de la personne connectée, sur les dossiers auxquels elle a accès.

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
- ✅ Permissions Graph limitées à `User.Read`, `Files.ReadWrite`,
  `offline_access`.

## Prochaine étape

→ `docs/ONEDRIVE_SETUP.md` pour créer les dossiers Photo de chaque
bâtiment et obtenir leurs liens de partage.
