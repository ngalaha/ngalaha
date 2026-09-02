/**
 * Formatage et arrondi — le SEUL endroit où un arrondi est autorisé.
 * Le reste du moteur de calcul manipule des valeurs exactes en double précision.
 */

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Arrondit vers le haut au multiple de `step` le plus proche. */
export function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil((value - Number.EPSILON) / step) * step;
}

/** Arrondit à l'entier supérieur (ex: nombre de blocs, sacs de ciment). */
export function ceilToInteger(value: number): number {
  return Math.ceil(value - Number.EPSILON);
}

export function formatNumber(value: number, decimals = 2): string {
  return roundTo(value, decimals).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMeters(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)} m`;
}

export function formatM2(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)} m²`;
}

export function formatM3(value: number, decimals = 3): string {
  return `${formatNumber(value, decimals)} m³`;
}
