// Pure types — safe to import from Remotion scene code (browser context).
// engine/media/local.ts uses Node's fs/child_process and must never be
// imported from a scene component; only from scripts/ CLIs.

export type MediaType = "image" | "video";

export interface MediaAsset {
  id: string;
  type: MediaType;
  /** Path relative to the project's public/ folder, e.g. "images/scene2.jpg". */
  localPath: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  /** Present for videos only. */
  durationSeconds?: number;
  /** Present for videos only — the container/codec ffprobe reported. */
  codec?: string;
  sizeBytes: number;
  /**
   * Whether this file is expected to play in this sandbox's Remotion
   * render (Chromium headless_shell). Always true for images. For videos,
   * false when the codec is known to fail here — see engine/README.md,
   * "<Video> dans Remotion : n'utiliser que du WebM/VP9".
   */
  remotionCompatible: boolean;
  compatibilityNote?: string;
}

export interface MediaSearchQuery {
  query: string;
  type?: MediaType;
  orientation?: "landscape" | "portrait" | "square";
  perPage?: number;
}

export interface MediaSearchResult {
  sourceId: string;
  /** The id of this item on the source platform. */
  externalId: string;
  type: MediaType;
  previewUrl: string;
  downloadUrl: string;
  width?: number;
  height?: number;
  author?: string;
  authorUrl?: string;
  license?: string;
  licenseUrl?: string;
  attributionRequired: boolean;
}

/**
 * One external media source (Pexels, Wikimedia Commons, ...). `search()`
 * returns metadata only; `download()` writes the actual file to disk.
 * Both throw MediaSourceBlockedError in this sandbox — see
 * engine/media/errors.ts and each adapter under engine/media/sources/.
 */
export interface MediaSourceAdapter {
  id: string;
  label: string;
  requiresApiKey: boolean;
  homepageUrl: string;
  search(query: MediaSearchQuery): Promise<MediaSearchResult[]>;
  download(result: MediaSearchResult, destPath: string): Promise<void>;
}
