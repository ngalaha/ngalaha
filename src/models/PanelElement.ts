import type { PanelCalcInput } from '../calculationEngine/panels';
import type { QuantityResult } from '../calculationEngine/types';

export interface PanelElement {
  id: string;
  projectId: string;
  category: string;
  input: PanelCalcInput;
  result: QuantityResult;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
