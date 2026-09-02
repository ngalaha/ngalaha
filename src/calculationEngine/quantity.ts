import { ceilToInteger, ceilToStep } from './format';
import type { QuantityResult, RoundingRule } from './types';

/**
 * Construit un `QuantityResult` complet à partir d'une valeur exacte :
 * applique la marge de perte puis la règle d'arrondi de commande, sans jamais
 * altérer la valeur exacte d'origine.
 */
export function buildQuantityResult(
  exact: number,
  unit: string,
  marginPercent: number,
  rounding: RoundingRule
): QuantityResult {
  const withMargin = exact * (1 + marginPercent / 100);
  const recommended = applyRounding(withMargin, rounding);
  return { exact, marginPercent, withMargin, recommended, unit };
}

export function applyRounding(value: number, rounding: RoundingRule): number {
  switch (rounding.type) {
    case 'step':
      return ceilToStep(value, rounding.step);
    case 'integer':
      return ceilToInteger(value);
    case 'none':
      return value;
    default: {
      const _exhaustive: never = rounding;
      return _exhaustive;
    }
  }
}
