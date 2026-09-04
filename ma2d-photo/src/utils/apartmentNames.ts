/** Guards against a typo like "1-9999" creating thousands of folders. */
const MAX_RANGE_SIZE = 500;

const RANGE_PATTERN = /^([^\d]*)(\d+)\s*(?:-|–|à)\s*([^\d]*)(\d+)$/;

/**
 * Expands one token into the apartment names it stands for.
 *
 * A building here has 27+ units, so typing every name by hand is the slow
 * part of setting one up: "101-127" therefore means 101, 102, … 127, and
 * a shared prefix carries over ("A-1 - A-5", or "A-1-5"). Leading zeros
 * are kept when both ends are written with them ("001-012"). Anything
 * that is not a plain range is taken literally, so a unit genuinely
 * called "PH-2" is never mangled.
 */
function expandToken(token: string): string[] {
  const match = token.match(RANGE_PATTERN);
  if (!match) return [token];

  const [, startPrefix, startDigits, endPrefix, endDigits] = match;
  // "A-1 - B-5" spans two different namings; there is no sensible range
  // between them, so keep the text as typed.
  if (endPrefix && endPrefix !== startPrefix) return [token];

  const start = Number(startDigits);
  const end = Number(endDigits);
  if (end < start || end - start + 1 > MAX_RANGE_SIZE) return [token];

  const width = startDigits.length === endDigits.length ? startDigits.length : 0;
  const names: string[] = [];
  for (let n = start; n <= end; n++) {
    names.push(`${startPrefix}${String(n).padStart(width, '0')}`);
  }
  return names;
}

/**
 * Turns the bulk-entry field into the list of apartment names to create:
 * one per line or comma, ranges expanded, blanks dropped and duplicates
 * removed (case-insensitively, like the database's own uniqueness check)
 * while keeping the order they were typed in.
 */
export function parseApartmentNames(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const token of text.split(/[\n,;]/)) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    for (const name of expandToken(trimmed)) {
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
  }

  return names;
}
