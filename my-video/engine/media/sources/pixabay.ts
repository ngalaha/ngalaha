import { MediaSourceBlockedError } from "../errors";
import type { MediaSearchQuery, MediaSearchResult, MediaSourceAdapter } from "../types";

const HOST = "pixabay.com";

/**
 * Pixabay. Requires a free API key (query param `key`).
 *
 * Real request shape (for when this host is reachable):
 *   GET https://pixabay.com/api/?key=<PIXABAY_API_KEY>&q=<query>&image_type=photo
 *   GET https://pixabay.com/api/videos/?key=<PIXABAY_API_KEY>&q=<query>
 *
 * License: Pixabay Content License — free to use, attribution not required.
 * `user`/`user_id` map to MediaSearchResult.author.
 */
export const pixabayAdapter: MediaSourceAdapter = {
  id: "pixabay",
  label: "Pixabay",
  requiresApiKey: true,
  homepageUrl: "https://pixabay.com",

  async search(_query: MediaSearchQuery): Promise<MediaSearchResult[]> {
    throw new MediaSourceBlockedError("pixabay", HOST);
  },

  async download(_result: MediaSearchResult, _destPath: string): Promise<void> {
    throw new MediaSourceBlockedError("pixabay", "cdn.pixabay.com");
  },
};
