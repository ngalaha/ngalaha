# DodoScope – suivi du sommeil par le son

Application web installable (PWA) qui écoute la chambre pendant la nuit et détecte :

- **Ronflements** : sons graves (< 400 Hz) qui reviennent à chaque respiration
- **Parole** : quand on parle en dormant
- **Toux / chocs** : sons brefs et forts
- **Autres bruits**

Chaque son est daté, mesuré (durée, niveau) et enregistré pour être réécouté le matin.
Un **indice de calme** sur 100 résume la nuit, avec un graphique du bruit heure par heure.
Tout reste sur le téléphone (IndexedDB). Rien n'est envoyé sur Internet.

## Application Android (APK)

Le fichier **`DodoScope.apk`** s'installe directement sur Android 7 ou plus récent :

1. Copier `DodoScope.apk` sur le téléphone (ou le télécharger depuis GitHub : bouton *Download raw file*).
2. L'ouvrir, puis autoriser « Installer des applis inconnues » pour le navigateur ou le gestionnaire de fichiers.
3. Au premier lancement, accepter le **micro** et les **notifications**.

Pendant la nuit, l'appli affiche une notification « DodoScope écoute ta nuit » (service micro au premier plan),
garde l'écran allumé et baisse la luminosité au minimum en *Mode sombre*. Laisse l'appli ouverte, téléphone branché.

Reconstruire l'APK (Linux) : `sudo apt install aapt dalvik-exchange zipalign apksigner openjdk-17-jdk` puis `android/build.sh`.
La clé de signature (`android/dodoscope.keystore`, hors du dépôt) est créée au premier build. Une mise à jour signée
avec une autre clé oblige à désinstaller l'appli, ce qui efface les nuits enregistrées.

## Version web (PWA)

1. Ouvrir la page en **https** (le micro ne marche pas en http), par exemple via GitHub Pages.
2. Dans Chrome sur Android : menu ⋮ → **Ajouter à l'écran d'accueil**.
3. Le soir : téléphone branché, posé près du lit, puis **Commencer la nuit**. Laisser l'appli ouverte.
   L'écran reste allumé ; le bouton *Mode sombre* le passe en noir.
4. Le matin : **Je me réveille** pour voir le bilan, écouter les sons et corriger leur type si besoin.

## Réglages

Sensibilité, enregistrement audio activé ou non, durée max. d'un extrait, délai avant le début de la détection.

## Limites

La classification se fait par une analyse simple des fréquences. C'est une estimation, pas un diagnostic médical.
Les niveaux en dB sont relatifs (micro non étalonné).

## Fichiers

`android/` (projet Android : WebView + service micro, `build.sh`), `index.html`, `styles.css`, `app.js` (analyse audio, détection, stockage, graphiques), `sw.js` (hors ligne), `manifest.webmanifest`, `icon.svg`.
Aucune dépendance, aucun build.
