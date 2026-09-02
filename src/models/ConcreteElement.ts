import type { ConcreteElementInput } from '../calculationEngine/concrete';

export interface ConcreteElement {
  id: string;
  projectId: string;
  category: string; // ex: "Fondations", "Dalle", "Balcons"
  input: ConcreteElementInput;
  volume: number; // m³ exact, calculé au moment de la sauvegarde
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}
