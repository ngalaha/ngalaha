import { openverseAdapter } from "./sources/openverse";
import { pexelsAdapter } from "./sources/pexels";
import { pixabayAdapter } from "./sources/pixabay";
import { unsplashAdapter } from "./sources/unsplash";
import { wikimediaAdapter } from "./sources/wikimedia";
import type { MediaSourceAdapter } from "./types";

export const MEDIA_SOURCES: Record<string, MediaSourceAdapter> = {
  unsplash: unsplashAdapter,
  pexels: pexelsAdapter,
  pixabay: pixabayAdapter,
  wikimedia: wikimediaAdapter,
  openverse: openverseAdapter,
};

export const getMediaSource = (id: string): MediaSourceAdapter => {
  const adapter = MEDIA_SOURCES[id];
  if (!adapter) {
    throw new Error(
      `Unknown media source "${id}". Available: ${Object.keys(MEDIA_SOURCES).join(", ")}`,
    );
  }
  return adapter;
};
