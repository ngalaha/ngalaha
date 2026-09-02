import type { ConcreteElementType } from '../calculationEngine/concrete';

export interface FieldConfig {
  key: string;
  label: string;
  isMeasurement: boolean; // true = parsé via measurementParser (pieds/pouces/mètres), false = nombre simple
}

export const CONCRETE_FIELD_CONFIG: Record<ConcreteElementType, FieldConfig[]> = {
  semelleFilante: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  semelleIsolee: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  semelleCombinee: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  poteauRectangulaire: [
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'profondeur', label: 'Profondeur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
  poteauCarre: [
    { key: 'cote', label: 'Côté', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
  poteauCirculaire: [
    { key: 'diametre', label: 'Diamètre', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
  murFondation: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  murBeton: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  dalleSimple: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  dalleSurSol: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  dalleStructurale: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  balcon: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  poutre: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
  poutreFondation: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
  radier: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'epaisseur', label: 'Épaisseur', isMeasurement: true },
  ],
  escalier: [
    { key: 'nombreMarches', label: 'Nombre de marches', isMeasurement: false },
    { key: 'giron', label: 'Giron', isMeasurement: true },
    { key: 'hauteurMarche', label: 'Hauteur de marche', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
  ],
  socle: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
  massif: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
  bordure: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
  personnalise: [
    { key: 'longueur', label: 'Longueur', isMeasurement: true },
    { key: 'largeur', label: 'Largeur', isMeasurement: true },
    { key: 'hauteur', label: 'Hauteur', isMeasurement: true },
  ],
};
