/**
 * Orchestration du "Calcul Rapide" (cahier des charges §6).
 *
 * Les dimensions arrivent déjà converties en mètres (voir `measurementParser`) ;
 * ce module ne fait qu'appliquer les formules exactes et laisse l'arrondi à
 * l'affichage (`format.ts`).
 */

import { boxVolume, rectangleArea } from './surfaces';
import { lengthToMeters, metersToLength, type LengthUnit } from './conversions';
import type { CalcResult, ValidationError } from './types';

export type QuickCalcInput =
  | { mode: 'volumeSimple'; longueur: number; largeur: number; epaisseur: number }
  | { mode: 'dalleSurface'; longueur: number; largeur: number; hauteur: number }
  | { mode: 'surface'; longueur: number; largeur: number }
  | { mode: 'longueur'; valeur: number }
  | { mode: 'volume'; longueur: number; largeur: number; hauteur: number }
  | { mode: 'conversion'; valeur: number; from: LengthUnit; to: LengthUnit }
  | { mode: 'additionVolumes'; volumes: number[] };

export type QuickCalcResult =
  | { mode: 'volumeSimple' | 'dalleSurface' | 'volume'; volume: number }
  | { mode: 'surface'; surface: number }
  | { mode: 'longueur'; longueur: number }
  | { mode: 'conversion'; value: number; unit: LengthUnit }
  | { mode: 'additionVolumes'; total: number; count: number };

function requirePositive(fields: Record<string, number>): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const [field, value] of Object.entries(fields)) {
    if (!Number.isFinite(value)) {
      errors.push({ field, message: `${field} doit être un nombre valide` });
    } else if (value <= 0) {
      errors.push({ field, message: `${field} doit être supérieur à zéro` });
    }
  }
  return errors;
}

export function computeQuickCalc(input: QuickCalcInput): CalcResult<QuickCalcResult> {
  switch (input.mode) {
    case 'volumeSimple': {
      const { longueur, largeur, epaisseur } = input;
      const errors = requirePositive({ longueur, largeur, epaisseur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: { mode: 'volumeSimple', volume: boxVolume(longueur, largeur, epaisseur) } };
    }

    case 'dalleSurface':
    case 'volume': {
      const { longueur, largeur, hauteur } = input;
      const errors = requirePositive({ longueur, largeur, hauteur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: { mode: input.mode, volume: boxVolume(longueur, largeur, hauteur) } };
    }

    case 'surface': {
      const { longueur, largeur } = input;
      const errors = requirePositive({ longueur, largeur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: { mode: 'surface', surface: rectangleArea(longueur, largeur) } };
    }

    case 'longueur': {
      const errors = requirePositive({ valeur: input.valeur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: { mode: 'longueur', longueur: input.valeur } };
    }

    case 'conversion': {
      if (!Number.isFinite(input.valeur)) {
        return { ok: false, errors: [{ field: 'valeur', message: 'Valeur invalide' }] };
      }
      const meters = lengthToMeters(input.valeur, input.from);
      const value = metersToLength(meters, input.to);
      return { ok: true, value: { mode: 'conversion', value, unit: input.to } };
    }

    case 'additionVolumes': {
      if (input.volumes.length === 0) {
        return { ok: false, errors: [{ field: 'volumes', message: 'Ajoutez au moins un volume' }] };
      }
      const errors: ValidationError[] = [];
      input.volumes.forEach((v, i) => {
        if (!Number.isFinite(v) || v <= 0) {
          errors.push({ field: `volumes[${i}]`, message: 'Chaque volume doit être supérieur à zéro' });
        }
      });
      if (errors.length) return { ok: false, errors };
      const total = input.volumes.reduce((sum, v) => sum + v, 0);
      return { ok: true, value: { mode: 'additionVolumes', total, count: input.volumes.length } };
    }

    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}
