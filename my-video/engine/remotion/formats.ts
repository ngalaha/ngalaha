export type VideoFormatId = "vertical" | "landscape";

export interface FormatPreset {
  id: VideoFormatId;
  width: number;
  height: number;
  fps: number;
  /** Horizontal safe margin from each edge, in px. */
  safeX: number;
  /** Safe margin from the top edge, in px. */
  safeTop: number;
  /** Safe margin from the bottom edge, in px. */
  safeBottom: number;
  /** Minimum recommended font size for a main headline, in px. */
  headlineMin: number;
  /** Minimum recommended font size for supporting text, in px. */
  supportingMin: number;
}

// 9:16 — Facebook/Instagram/TikTok Reels. This is the default format for
// new projects produced by this engine.
export const VERTICAL: FormatPreset = {
  id: "vertical",
  width: 1080,
  height: 1920,
  fps: 30,
  safeX: 80,
  safeTop: 160,
  safeBottom: 220,
  headlineMin: 84,
  supportingMin: 44,
};

// 16:9 — kept available for projects that need widescreen (YouTube, web).
export const LANDSCAPE: FormatPreset = {
  id: "landscape",
  width: 1920,
  height: 1080,
  fps: 30,
  safeX: 150,
  safeTop: 170,
  safeBottom: 170,
  headlineMin: 130,
  supportingMin: 56,
};

export const FORMATS: Record<VideoFormatId, FormatPreset> = {
  vertical: VERTICAL,
  landscape: LANDSCAPE,
};

export const DEFAULT_FORMAT_ID: VideoFormatId = "vertical";

export const getFormat = (id: VideoFormatId = DEFAULT_FORMAT_ID): FormatPreset =>
  FORMATS[id];
