import { MediaSourceBlockedError } from "../errors";
import type { MediaSearchQuery, MediaSearchResult, MediaSourceAdapter } from "../types";

const HOST = "api.unsplash.com";

/**
 * Unsplash. Requires a free API key (Access Key) for this adapter's own
 * HTTP calls.
 *
 * Special case: inside a Claude session with the Unsplash connector
 * enabled, searching Unsplash photos IS possible — but only through that
 * connector's own tool (routed through Anthropic's infrastructure, not
 * this sandbox's egress proxy), never through this adapter or any script.
 * That path returns metadata only; the actual file still cannot be
 * downloaded here (images.unsplash.com is blocked), so a chosen photo
 * still needs `sources.json` filled in by hand and the file supplied via
 * Local Mode from outside this sandbox.
 *
 * Real request shape (for when api.unsplash.com is reachable, e.g.
 * outside this sandbox):
 *   GET https://api.unsplash.com/search/photos?query=<query>&per_page=<n>
 *   Header: Authorization: Client-ID <UNSPLASH_ACCESS_KEY>
 *
 * License: Unsplash License — free to use, attribution appreciated but
 * not required.
 */
export const unsplashAdapter: MediaSourceAdapter = {
  id: "unsplash",
  label: "Unsplash",
  requiresApiKey: true,
  homepageUrl: "https://unsplash.com",

  async search(_query: MediaSearchQuery): Promise<MediaSearchResult[]> {
    throw new MediaSourceBlockedError("unsplash", HOST);
  },

  async download(_result: MediaSearchResult, _destPath: string): Promise<void> {
    throw new MediaSourceBlockedError("unsplash", "images.unsplash.com");
  },
};
