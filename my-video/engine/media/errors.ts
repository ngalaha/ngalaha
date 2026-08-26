/**
 * Thrown by every Internet-mode adapter's search()/download(). This
 * sandbox's egress proxy returns 403 for every stock-media/open-content
 * host tested (Wikimedia Commons, Pexels, Pixabay, Openverse, Unsplash's
 * own API/CDN, NASA, the Met, Internet Archive, Europeana, the Library of
 * Congress, Smithsonian, Rijksmuseum, Flickr, SMK — verified against the
 * proxy's own relay log, not just client-side timeouts). Only a short
 * allowlist (npm/pypi/cargo/go registries, Anthropic APIs, apt mirrors,
 * github.com/raw.githubusercontent.com/objects.githubusercontent.com) is
 * open. See engine/README.md for the full picture and how to recheck it
 * outside this sandbox.
 */
export class MediaSourceBlockedError extends Error {
  readonly sourceId: string;
  readonly host: string;

  constructor(sourceId: string, host: string) {
    super(
      `Source "${sourceId}" is not reachable from this sandbox (egress to ${host} is blocked by policy). ` +
        `The adapter's request shape is documented and ready to use outside this sandbox, or once the ` +
        `network policy allows ${host}.`,
    );
    this.name = "MediaSourceBlockedError";
    this.sourceId = sourceId;
    this.host = host;
  }
}
