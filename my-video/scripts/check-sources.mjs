#!/usr/bin/env node
// Verify that every file in a project's public/images and public/videos
// has a matching entry in its sources.json (traceability of external
// assets — see engine/schema/sources.schema.json).
//
// Usage: node scripts/check-sources.mjs <project-slug>

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/check-sources.mjs <project-slug>");
  process.exit(1);
}

const projectDir = join(rootDir, "projects", slug);
if (!existsSync(projectDir)) {
  console.error(`Projet introuvable: ${projectDir}`);
  process.exit(1);
}

const sourcesPath = join(projectDir, "sources.json");
let sources = [];
if (existsSync(sourcesPath)) {
  sources = JSON.parse(readFileSync(sourcesPath, "utf8"));
} else {
  console.warn(
    `Pas de sources.json dans ${projectDir} - toute image/video externe sera signalee.`,
  );
}

const trackedPaths = new Set(sources.map((s) => s.localPath));

const foldersToCheck = ["public/images", "public/videos"];
const missing = [];

for (const folder of foldersToCheck) {
  const abs = join(projectDir, folder);
  if (!existsSync(abs)) continue;
  for (const file of readdirSync(abs)) {
    if (file === ".gitkeep") continue;
    const relPath = `${folder}/${file}`;
    if (!trackedPaths.has(relPath)) {
      missing.push(relPath);
    }
  }
}

if (missing.length === 0) {
  console.log(
    `OK - toutes les images/videos de "${slug}" ont une entree dans sources.json (${sources.length} au total).`,
  );
  process.exit(0);
}

console.warn(`Fichiers sans entree dans sources.json pour "${slug}":`);
for (const m of missing) console.warn(`  - ${m}`);
process.exit(2);
