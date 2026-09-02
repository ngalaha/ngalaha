/**
 * Analyseur de saisie "pieds + pouces intelligente".
 *
 * Comprend automatiquement les formats de mesure de chantier courants au
 * Québec et retourne toujours une valeur exacte en mètres (aucun arrondi).
 * C'est une frontière du système (saisie utilisateur) : les entrées invalides
 * sont rapportées via un résultat discriminé plutôt que par exception.
 */

import { feetInchesToMeters, feetToMeters, inchesToMeters } from './conversions';

export type MeasurementParseResult =
  | { ok: true; meters: number; raw: string }
  | { ok: false; error: string; raw: string };

const NUM = String.raw`-?\d+(?:[.,]\d+)?`;

function toFloat(s: string): number {
  return parseFloat(s.replace(',', '.'));
}

// Formats "pieds + pouces" combinés, du plus spécifique au plus permissif.
const FEET_INCHES_PATTERNS: RegExp[] = [
  // 12'-6"  |  12' 6"  |  12'6"
  new RegExp(`^(${NUM})\\s*'\\s*-?\\s*(${NUM})\\s*"$`),
  // 12 pi 6 po  |  12pi 6po
  new RegExp(`^(${NUM})\\s*pi\\.?\\s+(${NUM})\\s*po\\.?$`, 'i'),
  // 12-6  (tiret nu, sans symboles d'unité)
  new RegExp(`^(${NUM})\\s*-\\s*(\\d+(?:[.,]\\d+)?)$`),
];

// Formats "unité unique".
const SINGLE_UNIT_PATTERNS: Array<{ regex: RegExp; toMeters: (value: number) => number }> = [
  { regex: new RegExp(`^(${NUM})\\s*(?:m|mètres?|metres?)$`, 'i'), toMeters: (v) => v },
  { regex: new RegExp(`^(${NUM})\\s*cm$`, 'i'), toMeters: (v) => v * 0.01 },
  { regex: new RegExp(`^(${NUM})\\s*mm$`, 'i'), toMeters: (v) => v * 0.001 },
  { regex: new RegExp(`^(${NUM})\\s*(?:"|po\\.?|pouces?)$`, 'i'), toMeters: inchesToMeters },
  { regex: new RegExp(`^(${NUM})\\s*(?:'|pi\\.?|pieds?)$`, 'i'), toMeters: feetToMeters },
];

// Nombre nu, sans unité : traité comme des pieds (unité de travail par défaut du chantier).
const BARE_NUMBER_PATTERN = new RegExp(`^(${NUM})$`);

export function parseMeasurement(input: string): MeasurementParseResult {
  const raw = input;
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: 'Mesure vide', raw };
  }

  for (const regex of FEET_INCHES_PATTERNS) {
    const match = trimmed.match(regex);
    if (match) {
      const feet = toFloat(match[1]);
      const inches = toFloat(match[2]);
      if (Math.abs(inches) >= 12) {
        return { ok: false, error: 'Les pouces doivent être inférieurs à 12', raw };
      }
      return { ok: true, meters: feetInchesToMeters(feet, inches), raw };
    }
  }

  for (const { regex, toMeters } of SINGLE_UNIT_PATTERNS) {
    const match = trimmed.match(regex);
    if (match) {
      return { ok: true, meters: toMeters(toFloat(match[1])), raw };
    }
  }

  const bareMatch = trimmed.match(BARE_NUMBER_PATTERN);
  if (bareMatch) {
    return { ok: true, meters: feetToMeters(toFloat(bareMatch[1])), raw };
  }

  return { ok: false, error: `Format de mesure non reconnu : "${input}"`, raw };
}

/** Variante qui lève une exception — pratique dans le moteur de calcul interne
 * lorsqu'une entrée est déjà supposée valide (ex: relecture d'un projet sauvegardé). */
export function parseMeasurementOrThrow(input: string): number {
  const result = parseMeasurement(input);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.meters;
}
