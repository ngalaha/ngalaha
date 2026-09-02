import type { QuantityResult, RoundingRule } from '../calculationEngine/types';

export interface OrderLine {
  id: string;
  description: string;
  result: QuantityResult;
  notes?: string;
}

export interface Order {
  id: string;
  projectId?: string;
  name: string;
  marginPercent: number;
  rounding: RoundingRule;
  lines: OrderLine[];
  createdAt: string;
  updatedAt: string;
}

export const LOSS_MARGIN_PRESETS = [2, 3, 5, 7, 10] as const;

export const ORDER_ROUNDING_PRESETS: { label: string; rule: RoundingRule }[] = [
  { label: '0.1', rule: { type: 'step', step: 0.1 } },
  { label: '0.25', rule: { type: 'step', step: 0.25 } },
  { label: '0.5', rule: { type: 'step', step: 0.5 } },
  { label: '1', rule: { type: 'step', step: 1 } },
];
