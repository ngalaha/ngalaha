// Local Mode implementation for the media module (engine/media/).
// Types described here match engine/media/types.ts's MediaAsset shape,
// duplicated as plain JS since this runs under Node (fs, ffprobe) and is
// never imported from Remotion scene code (browser context, no @types/node
// in this project — see engine/media/README.md).

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { extname, join } from "node:path";

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".mkv"]);

function readJpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 1 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    offset += 2;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue; // no-length markers
    if (marker === 0xd9 || marker === 0xda) break; // EOI / start of scan: no SOF found
    if (offset + 2 > buf.length) break;
    const segLength = buf.readUInt16BE(offset);
    const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      if (offset + 7 > buf.length) return null;
      return { height: buf.readUInt16BE(offset + 3), width: buf.readUInt16BE(offset + 5) };
    }
    offset += segLength;
  }
  return null;
}

function readPngSize(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24 || !sig.every((b, i) => buf[i] === b)) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readGifSize(buf) {
  const isGif = buf.length >= 10 && buf.toString("ascii", 0, 3) === "GIF";
  if (!isGif) return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

// Minimal, dependency-free image size reader: PNG, JPEG, GIF only. WebP
// needs RIFF/VP8/VP8L/VP8X parsing we chose not to add speculatively —
// unsupported files get width/height left undefined with a note instead
// of a guess.
function readImageSize(filePath) {
  const buf = readFileSync(filePath);
  return readPngSize(buf) || readJpegSize(buf) || readGifSize(buf) || null;
}

function isRemotionCompatibleVideo(codecName) {
  const codec = (codecName || "").toLowerCase();
  if (codec === "vp8" || codec === "vp9") return { compatible: true };
  return {
    compatible: false,
    note:
      `Codec "${codecName || "inconnu"}" : ne se lit pas dans le headless_shell Chromium de ce sandbox ` +
      `(DEMUXER_ERROR_NO_SUPPORTED_STREAMS confirmé pour H.264/MP4 — voir engine/README.md). ` +
      `Ré-encoder en VP9/WebM : ffmpeg -i in.mp4 -c:v libvpx-vp9 -b:v 0 -crf 30 -pix_fmt yuv420p out.webm`,
  };
}

function probeVideo(filePath) {
  try {
    const raw = execFileSync(
      "ffprobe",
      [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,codec_name:format=duration",
        "-of", "json",
        filePath,
      ],
      { encoding: "utf8" },
    );
    const parsed = JSON.parse(raw);
    const stream = parsed.streams?.[0] ?? {};
    const duration = parsed.format?.duration ? Number(parsed.format.duration) : undefined;
    return { width: stream.width, height: stream.height, codec: stream.codec_name, durationSeconds: duration };
  } catch (err) {
    return { probeError: err instanceof Error ? err.message : String(err) };
  }
}

// Keeps the extension in the slug (test.jpg -> "test-jpg") so two files
// that only differ by extension don't collide on the same id.
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Scans <projectDir>/public/{images,videos} and returns MediaAsset-shaped objects. */
export function scanLocalMedia(projectDir) {
  const assets = [];

  for (const [folder, type] of [["images", "image"], ["videos", "video"]]) {
    const abs = join(projectDir, "public", folder);
    if (!existsSync(abs)) continue;

    for (const file of readdirSync(abs)) {
      if (file.startsWith(".")) continue;
      const filePath = join(abs, file);
      if (!statSync(filePath).isFile()) continue;

      const ext = extname(file).toLowerCase();
      const localPath = `public/${folder}/${file}`;
      const sizeBytes = statSync(filePath).size;

      if (type === "image") {
        if (!IMAGE_EXT.has(ext)) continue;
        const dims = readImageSize(filePath);
        assets.push({
          id: slugify(file),
          type: "image",
          localPath,
          width: dims?.width,
          height: dims?.height,
          aspectRatio: dims ? dims.width / dims.height : undefined,
          sizeBytes,
          remotionCompatible: true,
          compatibilityNote: dims
            ? undefined
            : `Dimensions non lues : format "${ext}" non supporté par le lecteur minimal intégré (PNG/JPEG/GIF seulement, pas de nouvelle dépendance).`,
        });
      } else {
        if (!VIDEO_EXT.has(ext)) continue;
        const probe = probeVideo(filePath);
        const { compatible, note } = probe.probeError
          ? { compatible: false, note: `ffprobe a échoué : ${probe.probeError}` }
          : isRemotionCompatibleVideo(probe.codec);
        assets.push({
          id: slugify(file),
          type: "video",
          localPath,
          width: probe.width,
          height: probe.height,
          aspectRatio: probe.width && probe.height ? probe.width / probe.height : undefined,
          durationSeconds: probe.durationSeconds,
          codec: probe.codec,
          sizeBytes,
          remotionCompatible: compatible,
          compatibilityNote: note,
        });
      }
    }
  }

  return assets;
}

function loadSourcesJson(projectDir) {
  const path = join(projectDir, "sources.json");
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf8"));
}

function saveSourcesJson(projectDir, entries) {
  writeFileSync(join(projectDir, "sources.json"), JSON.stringify(entries, null, 2) + "\n");
}

/**
 * Adds a minimal sources.json entry (source: "local", url: null) for every
 * scanned asset that doesn't already have one. Never overwrites an
 * existing entry — author/license/url filled by hand stay untouched.
 */
export function syncSourcesJson(projectDir, assets) {
  const entries = loadSourcesJson(projectDir);
  const known = new Set(entries.map((e) => e.localPath));
  const added = [];

  for (const asset of assets) {
    if (known.has(asset.localPath)) continue;
    entries.push({
      id: asset.id,
      type: asset.type,
      url: null,
      source: "local",
      author: null,
      license: null,
      licenseUrl: null,
      localPath: asset.localPath,
      downloadedAt: null,
      notes:
        "Ajouté automatiquement par scripts/prepare-media.mjs (Mode local). " +
        "Si ce fichier vient d'Internet, renseigner url/author/license à la main.",
    });
    added.push(asset.localPath);
  }

  if (added.length > 0) saveSourcesJson(projectDir, entries);
  return { added, alreadyPresent: [...known] };
}
