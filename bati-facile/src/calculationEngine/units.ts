/**
 * Conversions métriques exactes — Bâti Facile ne travaille qu'en système
 * métrique (m, cm, mm), aucune conversion pieds/pouces.
 * Aucun arrondi intermédiaire : l'arrondi n'intervient qu'à l'affichage
 * (voir `format.ts`).
 */

export function cmToM(cm: number): number {
  return cm / 100;
}

export function mToCm(m: number): number {
  return m * 100;
}

export function mmToM(mm: number): number {
  return mm / 1000;
}

export function mToMm(m: number): number {
  return m * 1000;
}
