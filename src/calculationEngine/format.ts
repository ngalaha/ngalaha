/**
 * Formatage et arrondi — le SEUL endroit où un arrondi est autorisé.
 * Le reste du moteur de calcul manipule des valeurs exactes en double précision.
 */

import { metersToFeet, metersToInches } from './conversions';

/** Arrondit une valeur à un nombre de décimales donné, pour l'affichage uniquement. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Arrondit vers le haut au multiple de `step` le plus proche (ex: commandes, panneaux). */
export function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil((value - Number.EPSILON) / step) * step;
}

/** Arrondit à l'entier supérieur (ex: nombre de panneaux à commander). */
export function ceilToInteger(value: number): number {
  return Math.ceil(value - Number.EPSILON);
}

/** Formate un nombre en notation québécoise (virgule décimale). */
export function formatNumber(value: number, decimals = 2): string {
  return roundTo(value, decimals).toLocaleString('fr-CA', {
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

export function formatM3(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)} m³`;
}

const FRACTION_DENOMINATOR = 16;

/**
 * Formate une longueur exacte (en mètres) en pieds-pouces avec fraction de
 * pouce (ex: 3.81 → 12'-6"). L'arrondi ne se produit qu'ici, à l'affichage.
 */
export function formatFeetInches(meters: number, denominator = FRACTION_DENOMINATOR): string {
  const sign = meters < 0 ? '-' : '';
  const absMeters = Math.abs(meters);

  const totalInches = metersToInches(absMeters);
  let feet = Math.floor(totalInches / 12);
  let remainingInches = totalInches - feet * 12;

  let numerator = Math.round(remainingInches * denominator);
  let wholeInches = Math.floor(numerator / denominator);
  numerator -= wholeInches * denominator;

  if (numerator === denominator) {
    numerator = 0;
    wholeInches += 1;
  }
  if (wholeInches === 12) {
    wholeInches = 0;
    feet += 1;
  }

  const fractionGcd = numerator === 0 ? denominator : gcd(numerator, denominator);
  const fracNum = numerator / fractionGcd;
  const fracDen = denominator / fractionGcd;

  const inchPart =
    numerator === 0 ? `${wholeInches}` : `${wholeInches} ${fracNum}/${fracDen}`;

  if (feet === 0) {
    return `${sign}${inchPart}"`;
  }
  return `${sign}${feet}'-${inchPart}"`;
}

/** Décimal pieds (ex: 12.5 pi), arrondi à `decimals` décimales — pour l'affichage. */
export function formatDecimalFeet(meters: number, decimals = 2): string {
  return `${formatNumber(metersToFeet(meters), decimals)} pi`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
