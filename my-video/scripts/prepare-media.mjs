#!/usr/bin/env node
// Local Mode of the media module: scan a project's public/{images,videos},
// read metadata (dimensions, duration, codec) with no new dependency
// (pure-JS header parsing for images, ffprobe for videos — already
// installed), flag anything that won't play in this sandbox's Remotion
// render, and register any untracked file in sources.json.
//
// Usage: node scripts/prepare-media.mjs <project-slug>

import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanLocalMedia, syncSourcesJson } from "./lib/media-local.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/prepare-media.mjs <project-slug>");
  process.exit(1);
}

const projectDir = join(rootDir, "projects", slug);
if (!existsSync(projectDir)) {
  console.error(`Projet introuvable: ${projectDir}`);
  process.exit(1);
}

const assets = scanLocalMedia(projectDir);

if (assets.length === 0) {
  console.log(`Aucun média dans public/images ou public/videos pour "${slug}".`);
  process.exit(0);
}

console.log(`${assets.length} média(s) trouvé(s) pour "${slug}":\n`);

let hasIncompatible = false;
for (const a of assets) {
  const dims = a.width && a.height ? `${a.width}x${a.height}` : "dimensions inconnues";
  const extra = a.type === "video" ? `, ${a.durationSeconds?.toFixed(2) ?? "?"}s, codec ${a.codec ?? "?"}` : "";
  const flag = a.remotionCompatible ? "OK" : "INCOMPATIBLE REMOTION";
  console.log(`  [${flag}] ${a.localPath} — ${dims}${extra}`);
  if (a.compatibilityNote) {
    console.log(`      -> ${a.compatibilityNote}`);
    if (!a.remotionCompatible) hasIncompatible = true;
  }
}

const { added } = syncSourcesJson(projectDir, assets);
console.log();
if (added.length > 0) {
  console.log(`sources.json mis à jour : ${added.length} entrée(s) ajoutée(s) (source: "local", à compléter si le fichier vient d'Internet).`);
  for (const p of added) console.log(`  + ${p}`);
} else {
  console.log("sources.json déjà à jour, aucune entrée ajoutée.");
}

// Also write a small manifest scenes can read for exact dimensions/duration
// instead of hand-computing aspect ratios (see BeamReactionsVertical.tsx,
// which had to do this math inline before this module existed).
const manifestPath = join(projectDir, "public", "media-manifest.json");
writeFileSync(manifestPath, JSON.stringify(assets, null, 2) + "\n");
console.log(`\nManifeste écrit : ${manifestPath.replace(rootDir + "/", "")}`);

if (hasIncompatible) {
  console.log("\nAttention : au moins une vidéo ne se lira pas dans le rendu Remotion de ce sandbox (voir notes ci-dessus).");
  process.exit(2);
}
