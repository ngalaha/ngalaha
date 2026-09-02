import { CONCRETE_ELEMENT_LABELS, type ConcreteElementType } from '../calculationEngine/concrete';

export interface ConcreteCategoryGroup {
  category: string;
  types: ConcreteElementType[];
}

/** Regroupement des 20 types d'éléments béton par catégorie, pour l'organisation des projets. */
export const CONCRETE_CATEGORIES: ConcreteCategoryGroup[] = [
  { category: 'Fondations', types: ['semelleFilante', 'semelleIsolee', 'semelleCombinee', 'murFondation', 'poutreFondation', 'radier'] },
  { category: 'Structure', types: ['poteauRectangulaire', 'poteauCarre', 'poteauCirculaire', 'poutre', 'murBeton'] },
  { category: 'Dalles', types: ['dalleSimple', 'dalleSurSol', 'dalleStructurale'] },
  { category: 'Extérieur', types: ['balcon', 'escalier', 'bordure'] },
  { category: 'Autres', types: ['socle', 'massif', 'personnalise'] },
];

export const CONCRETE_TYPES: { type: ConcreteElementType; label: string }[] = (
  Object.keys(CONCRETE_ELEMENT_LABELS) as ConcreteElementType[]
).map((type) => ({ type, label: CONCRETE_ELEMENT_LABELS[type] }));
