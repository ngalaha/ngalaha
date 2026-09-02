/**
 * Moteur de conversion — indépendant de l'interface utilisateur.
 *
 * Règle absolue : aucune valeur intermédiaire n'est arrondie. Toutes les
 * conversions dérivent des constantes fondamentales exactes (1 pied = 0.3048 m,
 * 1 pouce = 0.0254 m) par multiplication/division en double précision IEEE-754,
 * ce qui est mathématiquement plus exact que d'utiliser une constante inverse
 * déjà tronquée. L'arrondi n'intervient jamais ici — uniquement à l'affichage
 * (voir `format.ts`).
 */

// Constantes fondamentales exactes (définitions officielles)
export const FEET_TO_M = 0.3048;
export const INCH_TO_M = 0.0254;
export const CM_TO_M = 0.01;
export const MM_TO_M = 0.001;

// Constantes dérivées, fournies pour référence et validation (cahier des charges).
// Utilisées uniquement à titre de documentation / tests — les calculs internes
// utilisent la division exacte par les constantes fondamentales ci-dessus.
export const M_TO_FEET_REF = 3.280839895;
export const M3_TO_FT3_REF = 35.3146667;
export const FT3_TO_M3_REF = 0.0283168466;
export const FT2_TO_M2_REF = 0.09290304;
export const IN2_TO_M2_REF = 0.00064516;

export function feetToMeters(feet: number): number {
  return feet * FEET_TO_M;
}

export function inchesToMeters(inches: number): number {
  return inches * INCH_TO_M;
}

export function metersToFeet(meters: number): number {
  return meters / FEET_TO_M;
}

export function metersToInches(meters: number): number {
  return meters / INCH_TO_M;
}

export function cmToMeters(cm: number): number {
  return cm * CM_TO_M;
}

export function mmToMeters(mm: number): number {
  return mm * MM_TO_M;
}

export function metersToCm(meters: number): number {
  return meters / CM_TO_M;
}

export function metersToMm(meters: number): number {
  return meters / MM_TO_M;
}

/** Longueur en pieds+pouces (ex: 12'-6") convertie en mètres exacts. */
export function feetInchesToMeters(feet: number, inches: number): number {
  return feetToMeters(feet) + inchesToMeters(inches);
}

// Surfaces
export function m2ToFt2(m2: number): number {
  return m2 / (FEET_TO_M * FEET_TO_M);
}

export function ft2ToM2(ft2: number): number {
  return ft2 * (FEET_TO_M * FEET_TO_M);
}

export function m2ToIn2(m2: number): number {
  return m2 / (INCH_TO_M * INCH_TO_M);
}

export function in2ToM2(in2: number): number {
  return in2 * (INCH_TO_M * INCH_TO_M);
}

// Volumes
export function m3ToFt3(m3: number): number {
  return m3 / (FEET_TO_M * FEET_TO_M * FEET_TO_M);
}

export function ft3ToM3(ft3: number): number {
  return ft3 * (FEET_TO_M * FEET_TO_M * FEET_TO_M);
}

export type LengthUnit = 'm' | 'cm' | 'mm' | 'ft' | 'in' | 'yd';

const YARD_TO_M = FEET_TO_M * 3;

/** Convertit une longueur exprimée dans `unit` vers des mètres exacts. */
export function lengthToMeters(value: number, unit: LengthUnit): number {
  switch (unit) {
    case 'm':
      return value;
    case 'cm':
      return cmToMeters(value);
    case 'mm':
      return mmToMeters(value);
    case 'ft':
      return feetToMeters(value);
    case 'in':
      return inchesToMeters(value);
    case 'yd':
      return value * YARD_TO_M;
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}

/** Convertit des mètres exacts vers l'unité demandée. */
export function metersToLength(meters: number, unit: LengthUnit): number {
  switch (unit) {
    case 'm':
      return meters;
    case 'cm':
      return metersToCm(meters);
    case 'mm':
      return metersToMm(meters);
    case 'ft':
      return metersToFeet(meters);
    case 'in':
      return metersToInches(meters);
    case 'yd':
      return meters / YARD_TO_M;
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}
