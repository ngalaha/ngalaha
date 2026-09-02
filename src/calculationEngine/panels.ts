/**
 * Calculateur Panneaux (cahier des charges §10).
 *
 * nombre théorique = surface totale ÷ surface d'un panneau
 * nombre à commander = ceil(nombre théorique × (1 + marge de perte))
 */

import { feetToMeters } from './conversions';
import { buildQuantityResult } from './quantity';
import type { QuantityResult, ValidationError } from './types';

export type PanelMaterialType =
  | 'contreplaque'
  | 'plywood'
  | 'osb'
  | 'playout'
  | 'coffrage'
  | 'personnalise';

export const PANEL_MATERIAL_LABELS: Record<PanelMaterialType, string> = {
  contreplaque: 'Contreplaqué',
  plywood: 'Plywood',
  osb: 'OSB',
  playout: 'Playout',
  coffrage: 'Panneau de coffrage',
  personnalise: 'Panneau personnalisé',
};

export interface PanelFormat {
  /** Nom d'affichage, ex: "4' × 8'" */
  label: string;
  largeur: number; // mètres
  longueur: number; // mètres
}

export const STANDARD_PANEL_FORMATS: Record<string, PanelFormat> = {
  '4x8': { label: "4' × 8'", largeur: feetToMeters(4), longueur: feetToMeters(8) },
  '4x10': { label: "4' × 10'", largeur: feetToMeters(4), longueur: feetToMeters(10) },
  '5x10': { label: "5' × 10'", largeur: feetToMeters(5), longueur: feetToMeters(10) },
};

export function panelSurface(format: PanelFormat): number {
  return format.largeur * format.longueur;
}

export interface PanelCalcInput {
  materialType: PanelMaterialType;
  surfaceTotale: number; // m², surface exacte à couvrir
  format: PanelFormat;
  marginPercent: number; // ex: 5 pour 5%
}

export function computePanelCount(input: PanelCalcInput): { ok: true; value: QuantityResult } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  if (!Number.isFinite(input.surfaceTotale) || input.surfaceTotale <= 0) {
    errors.push({ field: 'surfaceTotale', message: 'La surface totale doit être supérieure à zéro' });
  }
  const surfacePanneau = panelSurface(input.format);
  if (!Number.isFinite(surfacePanneau) || surfacePanneau <= 0) {
    errors.push({ field: 'format', message: 'Le format du panneau est invalide' });
  }
  if (!Number.isFinite(input.marginPercent) || input.marginPercent < 0) {
    errors.push({ field: 'marginPercent', message: 'La marge de perte doit être positive ou nulle' });
  }
  if (errors.length) return { ok: false, errors };

  const theoreticalCount = input.surfaceTotale / surfacePanneau;
  const result = buildQuantityResult(theoreticalCount, 'panneau', input.marginPercent, { type: 'integer' });
  return { ok: true, value: result };
}
