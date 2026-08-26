import { MediaSourceBlockedError } from "../errors";
import type { MediaSearchQuery, MediaSearchResult, MediaSourceAdapter } from "../types";

const HOST = "commons.wikimedia.org";

/**
 * Wikimedia Commons. No API key. Search via the MediaWiki API
 * (generator=search, prop=imageinfo for the actual file URL served from
 * upload.wikimedia.org), license read from the `extmetadata` field of the
 * imageinfo response (LicenseShortName, Artist, Credit).
 *
 * Real request shape (for when this host is reachable):
 *   GET https://commons.wikimedia.org/w/api.php
 *     ?action=query&generator=search&gsrsearch=<query>&gsrnamespace=6
 *     &prop=imageinfo&iiprop=url|size|extmetadata&format=json
 *
 * License note: most files are CC-BY-SA or CC0, but some are merely
 * "fair use" or otherwise restricted — always read `extmetadata.LicenseUrl`
 * per result rather than assuming.
 */
export const wikimediaAdapter: MediaSourceAdapter = {
  id: "wikimedia",
  label: "Wikimedia Commons",
  requiresApiKey: false,
  homepageUrl: "https://commons.wikimedia.org",

  async search(_query: MediaSearchQuery): Promise<MediaSearchResult[]> {
    throw new MediaSourceBlockedError("wikimedia", HOST);
  },

  async download(_result: MediaSearchResult, _destPath: string): Promise<void> {
    throw new MediaSourceBlockedError("wikimedia", "upload.wikimedia.org");
  },
};
