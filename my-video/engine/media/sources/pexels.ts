import { MediaSourceBlockedError } from "../errors";
import type { MediaSearchQuery, MediaSearchResult, MediaSourceAdapter } from "../types";

const HOST = "api.pexels.com";

/**
 * Pexels. Requires a free API key (header `Authorization: <key>`).
 *
 * Real request shape (for when this host is reachable):
 *   GET https://api.pexels.com/v1/search?query=<query>&per_page=<n>&orientation=<o>
 *   GET https://api.pexels.com/videos/search?query=<query>&per_page=<n>
 *   Header: Authorization: <PEXELS_API_KEY>
 *
 * License: Pexels License — free to use, attribution appreciated but not
 * required. `photographer`/`photographer_url` (photos) or `user`/`user_url`
 * (videos) map to MediaSearchResult.author/authorUrl.
 */
export const pexelsAdapter: MediaSourceAdapter = {
  id: "pexels",
  label: "Pexels",
  requiresApiKey: true,
  homepageUrl: "https://www.pexels.com",

  async search(_query: MediaSearchQuery): Promise<MediaSearchResult[]> {
    throw new MediaSourceBlockedError("pexels", HOST);
  },

  async download(_result: MediaSearchResult, _destPath: string): Promise<void> {
    throw new MediaSourceBlockedError("pexels", "images.pexels.com");
  },
};
