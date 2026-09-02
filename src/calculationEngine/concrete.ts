/**
 * Calculateur Béton — 20 types d'éléments (cahier des charges §9).
 *
 * Toutes les dimensions sont exprimées en mètres (le moteur de calcul est
 * indépendant de la saisie pieds/pouces, qui est convertie en amont via
 * `measurementParser`). Chaque fonction retourne un volume exact en m³, sans
 * aucun arrondi intermédiaire.
 */

import type { CalcResult, ValidationError } from './types';

export type ConcreteElementType =
  | 'semelleFilante'
  | 'semelleIsolee'
  | 'semelleCombinee'
  | 'poteauRectangulaire'
  | 'poteauCarre'
  | 'poteauCirculaire'
  | 'murFondation'
  | 'murBeton'
  | 'dalleSimple'
  | 'dalleSurSol'
  | 'dalleStructurale'
  | 'balcon'
  | 'poutre'
  | 'poutreFondation'
  | 'radier'
  | 'escalier'
  | 'socle'
  | 'massif'
  | 'bordure'
  | 'personnalise';

export const CONCRETE_ELEMENT_LABELS: Record<ConcreteElementType, string> = {
  semelleFilante: 'Semelle filante',
  semelleIsolee: 'Semelle isolée',
  semelleCombinee: 'Semelle combinée',
  poteauRectangulaire: 'Poteau rectangulaire',
  poteauCarre: 'Poteau carré',
  poteauCirculaire: 'Poteau circulaire',
  murFondation: 'Mur de fondation',
  murBeton: 'Mur de béton',
  dalleSimple: 'Dalle simple',
  dalleSurSol: 'Dalle sur sol',
  dalleStructurale: 'Dalle structurale',
  balcon: 'Balcon',
  poutre: 'Poutre',
  poutreFondation: 'Poutre de fondation',
  radier: 'Radier',
  escalier: 'Escalier',
  socle: 'Socle',
  massif: 'Massif',
  bordure: 'Bordure',
  personnalise: 'Élément personnalisé',
};

interface BoxDims {
  longueur: number;
  largeur: number;
  epaisseur: number;
}

interface LWH {
  longueur: number;
  largeur: number;
  hauteur: number;
}

export type ConcreteElementInput =
  | { type: 'semelleFilante'; label?: string; dims: BoxDims }
  | { type: 'semelleIsolee'; label?: string; dims: BoxDims }
  | { type: 'semelleCombinee'; label?: string; dims: BoxDims }
  | { type: 'poteauRectangulaire'; label?: string; dims: { largeur: number; profondeur: number; hauteur: number } }
  | { type: 'poteauCarre'; label?: string; dims: { cote: number; hauteur: number } }
  | { type: 'poteauCirculaire'; label?: string; dims: { diametre: number; hauteur: number } }
  | { type: 'murFondation'; label?: string; dims: { longueur: number; hauteur: number; epaisseur: number } }
  | { type: 'murBeton'; label?: string; dims: { longueur: number; hauteur: number; epaisseur: number } }
  | { type: 'dalleSimple'; label?: string; dims: BoxDims }
  | { type: 'dalleSurSol'; label?: string; dims: BoxDims }
  | { type: 'dalleStructurale'; label?: string; dims: BoxDims }
  | { type: 'balcon'; label?: string; dims: BoxDims }
  | { type: 'poutre'; label?: string; dims: LWH }
  | { type: 'poutreFondation'; label?: string; dims: LWH }
  | { type: 'radier'; label?: string; dims: BoxDims }
  | {
      type: 'escalier';
      label?: string;
      dims: { nombreMarches: number; giron: number; hauteurMarche: number; largeur: number };
    }
  | { type: 'socle'; label?: string; dims: LWH }
  | { type: 'massif'; label?: string; dims: LWH }
  | { type: 'bordure'; label?: string; dims: LWH }
  | { type: 'personnalise'; label?: string; dims: LWH };

function validatePositive(fields: Record<string, number>): ValidationError[] {
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

/** Calcule le volume exact (m³) d'un élément de béton, sans arrondi. */
export function computeConcreteVolume(input: ConcreteElementInput): CalcResult<number> {
  switch (input.type) {
    case 'semelleFilante':
    case 'semelleIsolee':
    case 'semelleCombinee':
    case 'dalleSimple':
    case 'dalleSurSol':
    case 'dalleStructurale':
    case 'balcon':
    case 'radier': {
      const { longueur, largeur, epaisseur } = input.dims;
      const errors = validatePositive({ longueur, largeur, epaisseur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: longueur * largeur * epaisseur };
    }

    case 'murFondation':
    case 'murBeton': {
      const { longueur, hauteur, epaisseur } = input.dims;
      const errors = validatePositive({ longueur, hauteur, epaisseur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: longueur * hauteur * epaisseur };
    }

    case 'poutre':
    case 'poutreFondation':
    case 'socle':
    case 'massif':
    case 'bordure':
    case 'personnalise': {
      const { longueur, largeur, hauteur } = input.dims;
      const errors = validatePositive({ longueur, largeur, hauteur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: longueur * largeur * hauteur };
    }

    case 'poteauRectangulaire': {
      const { largeur, profondeur, hauteur } = input.dims;
      const errors = validatePositive({ largeur, profondeur, hauteur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: largeur * profondeur * hauteur };
    }

    case 'poteauCarre': {
      const { cote, hauteur } = input.dims;
      const errors = validatePositive({ cote, hauteur });
      if (errors.length) return { ok: false, errors };
      return { ok: true, value: cote * cote * hauteur };
    }

    case 'poteauCirculaire': {
      const { diametre, hauteur } = input.dims;
      const errors = validatePositive({ diametre, hauteur });
      if (errors.length) return { ok: false, errors };
      const rayon = diametre / 2;
      return { ok: true, value: Math.PI * rayon * rayon * hauteur };
    }

    case 'escalier': {
      const { nombreMarches, giron, hauteurMarche, largeur } = input.dims;
      const errors = validatePositive({ nombreMarches, giron, hauteurMarche, largeur });
      if (!Number.isInteger(nombreMarches)) {
        errors.push({ field: 'nombreMarches', message: 'Le nombre de marches doit être un entier' });
      }
      if (errors.length) return { ok: false, errors };
      // Volume triangulaire par marche (giron × hauteur / 2) × largeur, cumulé sur toutes les marches.
      const value = nombreMarches * ((giron * hauteurMarche) / 2) * largeur;
      return { ok: true, value };
    }

    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}

export interface ConcreteElementResult {
  input: ConcreteElementInput;
  volume: number; // m³ exact
}

/** Additionne les volumes exacts de tous les éléments valides d'un projet multi-éléments. */
export function sumConcreteElements(
  inputs: ConcreteElementInput[]
): CalcResult<{ elements: ConcreteElementResult[]; totalVolume: number }> {
  const elements: ConcreteElementResult[] = [];
  const errors: ValidationError[] = [];

  inputs.forEach((input, index) => {
    const result = computeConcreteVolume(input);
    if (result.ok) {
      elements.push({ input, volume: result.value });
    } else {
      errors.push(
        ...result.errors.map((e) => ({ field: `[${index}] ${input.type}.${e.field}`, message: e.message }))
      );
    }
  });

  if (errors.length) return { ok: false, errors };

  const totalVolume = elements.reduce((sum, el) => sum + el.volume, 0);
  return { ok: true, value: { elements, totalVolume } };
}
