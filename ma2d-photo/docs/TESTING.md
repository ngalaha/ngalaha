# Scénario de test complet (spec section 36)

À exécuter après avoir : configuré le Client ID Microsoft
(`docs/ENTRA_ID_SETUP.md`), configuré au moins le dossier OneDrive du
Bâtiment A (`docs/ONEDRIVE_SETUP.md`), et installé un build réel
(`docs/ANDROID_BUILD.md` ou `docs/IOS_BUILD.md`/TestFlight).

## Test 1 — Connexion Microsoft
1. Ouvrir l'application.
2. Toucher "Se connecter avec Microsoft".
3. Se connecter avec un compte ayant accès aux dossiers OneDrive de
   Champfleury.
4. ✅ Résultat attendu : retour à l'écran principal, connecté.

## Test 2 — Sélection Champfleury > Bâtiment A
1. Vérifier que "CHAMPFLEURY" est sélectionné dans le sélecteur de projet
   (ou le choisir).
2. Toucher "A" dans la grille des bâtiments.
3. ✅ Résultat attendu : le bâtiment A est visuellement mis en évidence.

## Test 3 — Prendre une photo
1. Toucher le gros bouton "📷 PRENDRE UNE PHOTO".
2. Autoriser l'accès à l'appareil photo si demandé.
3. Prendre une photo, confirmer (ou reprendre si besoin, via l'écran natif
   de l'appareil photo).
4. ✅ Résultat attendu : retour à l'écran principal, la photo apparaît en
   haut de "Photos récentes" avec le statut "⏳ En attente" puis
   "🔄 Envoi..." puis "✅ Envoyée" (si en ligne).

## Test 4 — Vérifier le nom de fichier
1. Dans "Photos récentes", noter l'heure affichée.
2. Aller dans **⚙️ Administration > 🛠 Diagnostic**.
3. Chercher la ligne de journal "Upload completed" pour cette photo.
4. ✅ Résultat attendu : le nom de fichier suit le format
   `YYYY-MM-DD_HHmmss.jpg` (ex : `2026-08-31_103245.jpg`), heure locale.

## Test 5 — Présence du dossier `Photo/YYYY-MM-DD`
1. Ouvrir OneDrive (web ou application) avec le même compte Microsoft.
2. Naviguer jusqu'au dossier "Photo" du Bâtiment A.
3. ✅ Résultat attendu : un sous-dossier daté du jour (ex : `2026-08-31`)
   existe, créé automatiquement.

## Test 6 — La photo apparaît dans OneDrive
1. Ouvrir le sous-dossier de date.
2. ✅ Résultat attendu : la photo envoyée y figure, avec le nom généré au
   Test 4.

## Test 7 — Couper Internet
1. Activer le mode avion sur le téléphone (ou désactiver Wi-Fi + données).

## Test 8 — Prendre plusieurs photos hors ligne
1. Prendre 2 ou 3 photos (Bâtiment A ou B).
2. ✅ Résultat attendu : chaque photo apparaît avec le statut
   "⏳ En attente" ; un message "Connexion Internet indisponible. La photo
   a été sauvegardée et sera envoyée automatiquement." s'affiche.
3. Vérifier la bannière "📤 N photos en attente" sur l'écran principal.

## Test 9 — Fermer complètement l'application
1. Fermer l'application depuis le gestionnaire de tâches du téléphone
   (pas juste la mettre en arrière-plan).

## Test 10 — Rouvrir l'application
1. Relancer "MA2D Construction".
2. ✅ Résultat attendu : la session Microsoft est toujours active (pas de
   reconnexion demandée grâce à `offline_access`), et la bannière indique
   toujours "N photos en attente".

## Test 11 — Rétablir Internet
1. Désactiver le mode avion / réactiver le Wi-Fi.

## Test 12 — Vérifier l'envoi automatique
1. Attendre quelques secondes (l'app détecte la reconnexion et relance la
   synchronisation automatiquement).
2. ✅ Résultat attendu : les statuts passent de "⏳ En attente" à
   "🔄 Envoi..." puis "✅ Envoyée" sans aucune action manuelle. Les photos
   sont visibles dans OneDrive, dans le bon dossier de date.

## Tests complémentaires recommandés

- **Session expirée** : forcer une déconnexion Microsoft (via
  Administration ou en attendant l'expiration) puis prendre une photo →
  message "🔐 Votre session Microsoft doit être renouvelée." et la photo
  reste en file d'attente jusqu'à reconnexion.
- **Dossier non configuré** : prendre une photo pour un bâtiment sans
  lien OneDrive renseigné → message "⚠️ Ce bâtiment n'a pas encore de
  dossier OneDrive configuré." et statut "⚠ Échec" avec bouton
  "Réessayer" (utile une fois le dossier configuré ensuite).
- **Collision de nom** : prendre deux photos dans la même seconde (peu
  probable manuellement, mais vérifiable en relisant
  `src/services/storage/imageProcessing.ts`) → la deuxième doit recevoir
  le suffixe `_01`.
