# Media module

Deux modes, comme validé : **Local** (fonctionnel) et **Internet** (interface
+ adaptateurs, sans appel réseau implémenté pour les sources actuellement
bloquées dans ce sandbox — voir l'audit de connectivité dans l'historique du
projet, confirmé via le journal du proxy, pas seulement des timeouts côté
client).

## Mode local — fonctionnel

Implémentation : `../../scripts/lib/media-local.mjs` (bibliothèque) +
`../../scripts/prepare-media.mjs` (CLI). En JavaScript pur plutôt qu'en
TypeScript : ce code utilise `fs`/`child_process` (Node), et ce projet n'a
pas `@types/node` installé — l'ajouter serait installer un paquet, ce qui
n'est pas demandé. `engine/media/*.ts` reste donc uniquement des types et
adaptateurs sans dépendance Node, importables sans risque depuis du code de
scène Remotion (contexte navigateur).

```bash
node scripts/prepare-media.mjs <project-slug>
```

Ce que ça fait, pour chaque fichier dans `public/images/` et
`public/videos/` d'un projet :
1. Lit les dimensions (PNG/JPEG/GIF via parsing d'en-tête maison, sans
   dépendance — WebP non supporté, signalé plutôt que deviné) ou la durée
   et le codec vidéo (`ffprobe`, déjà installé).
2. Marque chaque vidéo `remotionCompatible: true/false` : les codecs
   **VP9/VP8** passent, **H.264/MP4 échoue** dans le `headless_shell`
   Chromium de ce sandbox (`DEMUXER_ERROR_NO_SUPPORTED_STREAMS`, confirmé
   sur `beam-reactions-vertical`) — voir `../README.md`.
3. Ajoute une entrée minimale dans `sources.json` pour tout fichier non
   encore tracé (`source: "local"`, `url: null` — à compléter à la main si
   le fichier vient en fait d'Internet).
4. Écrit `public/media-manifest.json` : dimensions/durée déjà calculées,
   pour que le code de scène n'ait plus à refaire le calcul d'aspect ratio
   à la main (comme `BeamReactionsVertical.tsx` avait dû le faire avant
   que ce module existe).

## Mode internet — interface + adaptateurs, non fonctionnels ici

`types.ts` définit `MediaSourceAdapter` (`search()` / `download()`) et
`MediaSearchQuery`/`MediaSearchResult`. Cinq adaptateurs dans `sources/`
(Unsplash, Pexels, Pixabay, Wikimedia Commons, Openverse) implémentent
l'interface mais lèvent `MediaSourceBlockedError` — la requête HTTP réelle
n'est **pas implémentée**, seulement documentée en commentaire (endpoint,
paramètres, authentification) pour être complétée quand l'hôte sera
joignable (hors sandbox, ou politique réseau élargie).

`registry.ts` expose `MEDIA_SOURCES` / `getMediaSource(id)` pour retrouver
un adaptateur par id.

Aucune clé API n'est gérée ici (Pexels/Pixabay/Unsplash en demandent une
côté vrai déploiement — voir le commentaire de chaque adaptateur).

## `sources.json`

Le schéma (`../schema/sources.schema.json`) accepte maintenant `url: null`
pour les entrées `source: "local"` sans origine internet connue — `id`,
`type` et `localPath` restent seuls obligatoires.
