/** Zero-pad a number to 2 digits. */
function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Local YYYY-MM-DD for a given date (defaults to now). Uses device local time. */
export function formatDateFolder(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Local HHmmss for a given date. */
export function formatTimeCompact(date: Date = new Date()): string {
  return `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
}

/** Zero-pad milliseconds to 3 digits. */
function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}

/**
 * Base file name (without collision suffix): YYYY-MM-DD_HHmmss_mmm.
 * Millisecond precision matters here: several photos of the same spot are
 * routinely taken within the same second (spec: file names must never
 * collide on a same-day, same-location capture), and the "_NN" collision
 * suffix in generateUniqueFileName() is a last-resort fallback, not the
 * primary defense.
 */
export function formatBaseFileName(date: Date = new Date()): string {
  return `${formatDateFolder(date)}_${formatTimeCompact(date)}_${pad3(date.getMilliseconds())}`;
}

/** Human-readable HH:mm for the "Photos récentes" list. */
export function formatShortTime(isoDate: string): string {
  const d = new Date(isoDate);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
