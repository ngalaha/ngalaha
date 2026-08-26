import { MediaSourceBlockedError } from "../errors";
import type { MediaSearchQuery, MediaSearchResult, MediaSourceAdapter } from "../types";

const HOST = "api.openverse.org";

/**
 * Openverse — aggregates CC-licensed content from many providers (no
 * video, images and audio only). No API key required for basic search
 * (an optional client id/secret raises rate limits).
 *
 * Real request shape (for when this host is reachable):
 *   GET https://api.openverse.org/v1/images/?q=<query>
 *
 * License varies per result (CC0 to CC-BY-NC) — always read the `license`
 * and `license_url` fields per item rather than assuming.
 */
export const openverseAdapter: MediaSourceAdapter = {
  id: "openverse",
  label: "Openverse",
  requiresApiKey: false,
  homepageUrl: "https://openverse.org",

  async search(query: MediaSearchQuery): Promise<MediaSearchResult[]> {
    if (query.type === "video") {
      throw new Error("Openverse does not index video — images and audio only.");
    }
    throw new MediaSourceBlockedError("openverse", HOST);
  },

  async download(_result: MediaSearchResult, _destPath: string): Promise<void> {
    throw new MediaSourceBlockedError("openverse", HOST);
  },
};
