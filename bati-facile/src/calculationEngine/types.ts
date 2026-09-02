/**
 * Types partagés du moteur de calcul.
 *
 * `QuantityResult` matérialise le principe : on conserve toujours séparément
 * la valeur exacte, la valeur avec marge de casse et la valeur recommandée à
 * commander — jamais une seule valeur arrondie qui écraserait les autres.
 */

export interface QuantityResult {
  /** Valeur exacte, non arrondie. */
  exact: number;
  /** Marge de casse appliquée, en pourcentage (ex: 5 pour 5%). */
  marginPercent: number;
  /** Valeur exacte + marge, non arrondie. */
  withMargin: number;
  /** Valeur à commander : `withMargin` arrondie selon la règle de commande. */
  recommended: number;
  unit: string;
}

export type RoundingRule =
  | { type: 'step'; step: number }
  | { type: 'integer' }
  | { type: 'none' };

export interface ValidationError {
  field: string;
  message: string;
}

export type CalcResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };
