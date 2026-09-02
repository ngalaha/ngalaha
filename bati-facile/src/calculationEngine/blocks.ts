/**
 * Moteur de calcul des blocs (parpaings) — cœur de Bâti Facile.
 *
 * Méthode : nombre de blocs au m² déterminé par le format du bloc et
 * l'épaisseur de joint, appliqué à la surface nette du mur (surface brute
 * moins les ouvertures). C'est la méthode standard utilisée pour les devis
 * quantitatifs de maçonnerie.
 *
 * Aucun arrondi n'intervient ici : chaque mur produit un nombre de blocs
 * EXACT (non entier). La marge de casse et l'arrondi de commande
 * s'appliquent une seule fois, au niveau de l'agrégat multi-murs, pour
 * éviter d'accumuler des arrondis mur par mur.
 */

import type { Wall, Opening } from '../models/Wall';
import type { BlockFormat } from '../materials/blocks';
import type { CalcResult, ValidationError } from './types';

export function wallGrossSurface(wall: Wall): number {
  return wall.longueur * wall.hauteur;
}

export function openingsSurface(openings: Opening[]): number {
  return openings.reduce((sum, o) => sum + o.largeur * o.hauteur * o.quantite, 0);
}

export function wallNetSurface(wall: Wall): number {
  return wallGrossSurface(wall) - openingsSurface(wall.openings);
}

/** Nombre de blocs nécessaires pour couvrir 1 m² de mur, selon le format et le joint. */
export function blocksPerM2(block: BlockFormat, jointEpaisseur: number): number {
  const longueurUtile = block.longueur + jointEpaisseur;
  const hauteurUtile = block.hauteur + jointEpaisseur;
  return 1 / (longueurUtile * hauteurUtile);
}

export interface WallBlockLine {
  wall: Wall;
  block: BlockFormat;
  grossSurface: number; // m², exact
  openingsSurface: number; // m², exact
  netSurface: number; // m², exact
  exactBlocks: number; // nombre exact de blocs, non arrondi
}

function validateWall(wall: Wall, block: BlockFormat | undefined): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!block) {
    errors.push({ field: 'blockId', message: `Format de bloc introuvable : ${wall.blockId}` });
    return errors;
  }
  if (!Number.isFinite(wall.longueur) || wall.longueur <= 0) {
    errors.push({ field: 'longueur', message: 'La longueur du mur doit être supérieure à zéro' });
  }
  if (!Number.isFinite(wall.hauteur) || wall.hauteur <= 0) {
    errors.push({ field: 'hauteur', message: 'La hauteur du mur doit être supérieure à zéro' });
  }
  if (!Number.isFinite(wall.jointEpaisseur) || wall.jointEpaisseur < 0) {
    errors.push({ field: 'jointEpaisseur', message: "L'épaisseur du joint doit être positive ou nulle" });
  }
  wall.openings.forEach((o, i) => {
    if (!Number.isFinite(o.largeur) || o.largeur <= 0) {
      errors.push({ field: `openings[${i}].largeur`, message: "La largeur de l'ouverture doit être supérieure à zéro" });
    }
    if (!Number.isFinite(o.hauteur) || o.hauteur <= 0) {
      errors.push({ field: `openings[${i}].hauteur`, message: "La hauteur de l'ouverture doit être supérieure à zéro" });
    }
    if (!Number.isInteger(o.quantite) || o.quantite < 1) {
      errors.push({ field: `openings[${i}].quantite`, message: 'La quantité doit être un entier positif' });
    }
  });
  if (errors.length === 0 && block) {
    const net = wallNetSurface(wall);
    if (net <= 0) {
      errors.push({
        field: 'openings',
        message: 'Les ouvertures couvrent la totalité (ou plus) de la surface du mur',
      });
    }
  }
  return errors;
}

/** Calcule le nombre exact de blocs pour un mur, sans marge ni arrondi. */
export function computeWallBlocks(wall: Wall, block: BlockFormat | undefined): CalcResult<WallBlockLine> {
  const errors = validateWall(wall, block);
  if (errors.length > 0 || !block) return { ok: false, errors };

  const grossSurface = wallGrossSurface(wall);
  const openings = openingsSurface(wall.openings);
  const netSurface = grossSurface - openings;
  const exactBlocks = netSurface * blocksPerM2(block, wall.jointEpaisseur);

  return {
    ok: true,
    value: { wall, block, grossSurface, openingsSurface: openings, netSurface, exactBlocks },
  };
}

export interface BlockTypeTotal {
  block: BlockFormat;
  totalExactBlocks: number;
  totalNetSurface: number;
  wallCount: number;
}

/** Additionne les blocs exacts de plusieurs murs, groupés par format de bloc utilisé. */
export function sumWallsBlocks(
  entries: { wall: Wall; block: BlockFormat | undefined }[]
): CalcResult<{ lines: WallBlockLine[]; totalsByBlock: Record<string, BlockTypeTotal>; totalExactBlocks: number }> {
  const lines: WallBlockLine[] = [];
  const errors: ValidationError[] = [];

  entries.forEach(({ wall, block }, index) => {
    const result = computeWallBlocks(wall, block);
    if (result.ok) {
      lines.push(result.value);
    } else {
      errors.push(...result.errors.map((e) => ({ field: `[${index}] ${wall.label}.${e.field}`, message: e.message })));
    }
  });

  if (errors.length > 0) return { ok: false, errors };

  const totalsByBlock: Record<string, BlockTypeTotal> = {};
  for (const line of lines) {
    const existing = totalsByBlock[line.block.id];
    if (existing) {
      existing.totalExactBlocks += line.exactBlocks;
      existing.totalNetSurface += line.netSurface;
      existing.wallCount += 1;
    } else {
      totalsByBlock[line.block.id] = {
        block: line.block,
        totalExactBlocks: line.exactBlocks,
        totalNetSurface: line.netSurface,
        wallCount: 1,
      };
    }
  }

  const totalExactBlocks = lines.reduce((sum, l) => sum + l.exactBlocks, 0);

  return { ok: true, value: { lines, totalsByBlock, totalExactBlocks } };
}
