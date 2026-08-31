# Configurer les dossiers OneDrive (Champfleury, Bâtiments A-F)

L'application ne devine jamais un dossier OneDrive : c'est l'administrateur
qui fournit, pour chaque bâtiment, le lien de partage exact de son dossier
"Photo". L'application le transforme ensuite en référence stable
(Drive ID + Item ID) via Microsoft Graph (spec section 6).

## 1. Préparer l'arborescence dans OneDrive

**ACTION À FAIRE**, pour chaque bâtiment (A à F pour Champfleury) :
1. Dans OneDrive (ou la bibliothèque SharePoint utilisée par votre
   organisation), créer/localiser un dossier dédié au bâtiment, par
   exemple : `Champfleury/Bâtiment A/Photo`.
2. Le sous-dossier de date (`2026-08-31`, etc.) sera créé **automatiquement**
   par l'application au premier envoi de photo — ne le créez pas à la main.

## 2. Obtenir le lien de partage du dossier "Photo"

**ACTION À FAIRE**
1. Clic droit sur le dossier `Photo` du bâtiment (ou bouton "..." sur
   mobile/web) > **Partager**.
2. Choisir un niveau d'accès adapté à votre organisation :
   - *Recommandé* : "Les personnes de [votre organisation] ayant le lien
     peuvent modifier" — cela permet à tout compte Microsoft autorisé de
     l'entreprise d'uploader des photos.
   - Évitez "Toute personne disposant du lien" pour des données de
     chantier internes, sauf si c'est un choix assumé par MA2D
     Construction.
3. Cliquer **Copier le lien**.
4. Conserver ce lien : il sera collé dans l'écran Administration de
   l'application.

⚠️ Le compte Microsoft utilisé pour se connecter dans l'application doit
avoir **au minimum un accès en modification** à ce dossier, sinon
l'upload et la création du sous-dossier de date échoueront (message
"⚠️ Impossible d'accéder au dossier OneDrive.").

## 3. Renseigner le lien dans l'application

**ACTION À FAIRE**
1. Ouvrir l'application MA2D Construction, se connecter avec un compte
   Microsoft administrateur.
2. Aller dans **⚙️ Administration**.
3. Sous "CHAMPFLEURY", repérer le bâtiment concerné et toucher
   **Modifier**.
4. Coller le lien copié à l'étape 2 dans le champ "Lien dossier Photo
   OneDrive".
5. Toucher **Enregistrer**. L'application appelle Microsoft Graph pour :
   - résoudre le lien en **Drive ID** + **Item ID** ;
   - vérifier que le dossier est bien accessible ;
   - afficher "✓ OneDrive connecté" si tout est bon, ou l'erreur précise
     sinon (ex : "⚠️ Ce lien OneDrive n'est pas valide ou n'est pas
     accessible avec ce compte.").
6. Répéter pour chaque bâtiment (A, B, C, D, E, F).

## 4. Où renseigner les 6 liens de Champfleury

**ACTION À FAIRE** — Vous devez fournir les 6 liens réels ici (dans
l'app, via Administration) :

```
Bâtiment A : [LIEN À FOURNIR]
Bâtiment B : [LIEN À FOURNIR]
Bâtiment C : [LIEN À FOURNIR]
Bâtiment D : [LIEN À FOURNIR]
Bâtiment E : [LIEN À FOURNIR]
Bâtiment F : [LIEN À FOURNIR]
```

Tant qu'un lien n'est pas renseigné et vérifié, le bâtiment correspondant
affiche "⚠ Dossier non configuré" dans Administration, et toute photo
prise pour ce bâtiment reste dans la file d'attente locale (jamais
perdue) jusqu'à ce que le dossier soit configuré puis qu'une
synchronisation soit relancée.

## 5. Comment ça fonctionne techniquement (pour référence)

1. `resolveShareLink()` encode le lien de partage selon le format attendu
   par l'API `/shares/{shareId}/driveItem` de Microsoft Graph
   (voir `src/services/microsoftGraph/oneDriveService.ts`).
2. Le `driveId` et l'`itemId` renvoyés sont stockés dans la base locale —
   ce sont eux, et non l'URL, qui servent de référence pour chaque upload
   (spec section 6).
3. À chaque photo envoyée, l'app cherche (ou crée) le sous-dossier
   `YYYY-MM-DD` par adressage direct
   `/drives/{driveId}/items/{itemId}:/{date}` — pas besoin de reparcourir
   toute l'arborescence.

## Prochaine étape

→ `docs/ANDROID_BUILD.md` pour générer un APK installable et tester sur un
téléphone Android.
