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

/** Base file name (without collision suffix): YYYY-MM-DD_HHmmss */
export function formatBaseFileName(date: Date = new Date()): string {
  return `${formatDateFolder(date)}_${formatTimeCompact(date)}`;
}

/** Human-readable HH:mm for the "Photos récentes" list. */
export function formatShortTime(isoDate: string): string {
  const d = new Date(isoDate);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
