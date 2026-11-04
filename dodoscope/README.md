# DodoScope – suivi du sommeil par le son

Application web installable (PWA) qui écoute la chambre pendant la nuit et détecte :

- **Ronflements** : sons graves (< 400 Hz) qui reviennent à chaque respiration
- **Parole** : quand on parle en dormant
- **Toux / chocs** : sons brefs et forts
- **Autres bruits**

Chaque son est daté, mesuré (durée, niveau) et enregistré pour être réécouté le matin.
Un **indice de calme** sur 100 résume la nuit, avec un graphique du bruit heure par heure.
Tout reste sur le téléphone (IndexedDB). Rien n'est envoyé sur Internet.

## Utilisation

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

`index.html`, `styles.css`, `app.js` (analyse audio, détection, stockage, graphiques), `sw.js` (hors ligne), `manifest.webmanifest`, `icon.svg`.
Aucune dépendance, aucun build.
