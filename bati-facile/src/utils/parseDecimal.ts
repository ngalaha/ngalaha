/** Analyse un nombre décimal saisi par l'utilisateur, virgule ou point accepté. */
export function parseDecimal(raw: string): number | undefined {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed.length === 0) return undefined;
  const value = parseFloat(trimmed);
  return Number.isFinite(value) ? value : undefined;
}
