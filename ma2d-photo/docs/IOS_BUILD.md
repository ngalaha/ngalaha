# Générer l'application iOS (TestFlight puis App Store)

## ⚠️ Ce qui nécessite obligatoirement un compte Apple Developer

Apple **impose** un compte Apple Developer Program (99 USD/an) pour :
- signer numériquement toute application iOS (même pour un simple test
  interne sur un iPhone physique) ;
- distribuer via **TestFlight** ;
- publier sur l'**App Store**.

Il n'existe **aucun moyen légitime** de produire ou distribuer un `.ipa`
installable sur un iPhone réel sans ce compte — ne vous fiez à aucun outil
prétendant le contraire.

**ACTION À FAIRE** (si pas déjà fait) :
1. Aller sur https://developer.apple.com/programs/enroll/
2. S'inscrire avec un identifiant Apple (idéalement un compte
   "organisation" au nom de MA2D Construction, avec numéro D-U-N-S — voir
   les instructions Apple pour "Enroll as an organization").
3. Payer la cotisation annuelle (99 USD).
4. Attendre la validation (peut prendre 24 à 48h pour un compte
   organisation).

## 1. Prérequis côté projet

- Avoir suivi `docs/WINDOWS_SETUP.md` et configuré `MICROSOFT_CLIENT_ID`
  (voir `docs/ENTRA_ID_SETUP.md`).
- Avoir ajouté dans Entra ID une URI de redirection compatible iOS —
  `ma2dphoto://auth` fonctionne aussi bien sur iOS que sur Android car le
  schéma est déclaré dans `app.json > expo.scheme`.
- Avoir un compte Apple Developer actif (ci-dessus).

## 2. Se connecter à EAS et Apple

```powershell
npx eas login
npx eas build --platform ios --profile production
```

- La première fois, `eas build` demande vos identifiants Apple Developer
  et peut générer automatiquement pour vous :
  - un **Bundle Identifier** (déjà fixé dans `app.json` :
    `com.ma2dconstruction.photo` — modifiable si nécessaire) ;
  - un certificat de distribution ;
  - un profil de provisionnement.
- EAS gère cela pour vous ("EAS-managed credentials") — répondez "Yes"
  aux invites pour laisser EAS créer/gérer les certificats, sauf si votre
  organisation a déjà des certificats existants à réutiliser.

## 3. Permissions caméra / photos (déjà configurées)

`app.json` déclare déjà les textes de permission iOS requis par Apple :
- `NSCameraUsageDescription` (accès appareil photo)
- `NSPhotoLibraryUsageDescription` (accès galerie)
- `NSPhotoLibraryAddUsageDescription` (enregistrement dans la galerie)

Ces messages sont affichés à l'utilisateur lors de la première demande
d'autorisation — adaptez le texte dans `app.json > expo.ios.infoPlist` si
besoin.

## 4. Envoyer la build sur TestFlight

**ACTION À FAIRE**
```powershell
npx eas submit --platform ios
```
- Renseigne (ou réutilise depuis `eas.json > submit.production.ios`) :
  - `appleId` : votre identifiant Apple (e-mail)
  - `ascAppId` : l'ID de l'app dans App Store Connect (créé automatiquement
    au premier submit, ou à créer manuellement sur
    https://appstoreconnect.apple.com > Mes Apps > "+")
  - `appleTeamId` : visible sur https://developer.apple.com/account
    (Membership)
- Une fois l'envoi terminé, la build apparaît dans **App Store Connect >
  TestFlight** après quelques minutes de traitement Apple.

## 5. Ajouter des testeurs internes

**ACTION À FAIRE**
1. Aller sur https://appstoreconnect.apple.com
2. Sélectionner l'app > **TestFlight**.
3. Sous "Testeurs internes", ajouter les adresses e-mail des personnes
   (jusqu'à 100 testeurs internes, membres de votre équipe Apple
   Developer).
4. Chaque testeur reçoit une invitation par e-mail, installe l'app
   **TestFlight** depuis l'App Store, puis installe "MA2D Construction"
   depuis TestFlight.

Pour des testeurs externes (au-delà de l'équipe), Apple exige une revue
TestFlight (généralement rapide, 24-48h).

## 6. Publication sur l'App Store (plus tard, optionnel)

**ACTION À FAIRE**
1. Dans App Store Connect, compléter la fiche : captures d'écran,
   description, politique de confidentialité, catégorie, âge minimum,
   etc. (exigences standard Apple).
2. Soumettre la build pour revue Apple ("Submit for Review").
3. Délai de revue Apple : généralement 24h à quelques jours ; peut être
   refusée si des exigences (confidentialité, permissions non justifiées)
   ne sont pas respectées — vérifier les messages de permission
   (section 3 ci-dessus) restent cohérents avec l'usage réel de l'app.

## Résumé des dépendances Apple obligatoires

| Élément | Obligatoire pour | Fourni par |
|---|---|---|
| Compte Apple Developer (99 USD/an) | Tout test réel + TestFlight + App Store | Vous (MA2D Construction) |
| Certificat de distribution + provisioning profile | Signer la build iOS | EAS (automatique) ou vous |
| App Store Connect (ascAppId) | TestFlight + App Store | Créé au premier submit |
