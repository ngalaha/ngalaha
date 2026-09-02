/**
 * Bourrage des murs de soubassement/fondation — remplissage au béton des
 * alvéoles des parpaings (`Wall.bourre = true`), quel que soit leur format
 * (15×20×40 ou 20×20×40 : le bourrage est un choix de mise en œuvre, pas une
 * propriété du bloc — voir `models/Wall.ts`).
 *
 * Taux de vide retenu : les fiches techniques de blocs creux à enduire
 * (normes NF EN 771-3) indiquent que les alvéoles représentent 50 à 60 % du
 * volume brut du bloc pour les formats courants 15×20×40 et 20×20×40. Faute
 * de ratio terrain confirmé (comme celui obtenu pour le ciment de pose,
 * 140 blocs/sac), on retient 55 % — la valeur médiane — comme estimation par
 * défaut, entièrement ajustable et À CONFIRMER avec l'expérience terrain
 * avant de servir de référence commerciale.
 *
 * Dosage béton de bourrage : dosage courant "350" (350 kg ciment, 500 L
 * sable, 700 L gravier pour 1 m³ de béton), usuel pour fondations et
 * ouvrages courants.
 */

import type { BlockFormat } from '../materials/blocks';

/** Taux de vide moyen des parpaings creux (50-60% selon NF EN 771-3) — estimation à confirmer. */
export const DEFAULT_VOID_FRACTION = 0.55;

export function blockGrossVolume(block: BlockFormat): number {
  return block.epaisseur * block.hauteur * block.longueur;
}

/** Volume de béton nécessaire pour bourrer un seul bloc. */
export function blockVoidVolume(block: BlockFormat, voidFraction: number = DEFAULT_VOID_FRACTION): number {
  return blockGrossVolume(block) * voidFraction;
}

/** Volume total de béton de bourrage pour un nombre de blocs donné, exact (non arrondi). */
export function computeBourrageConcreteVolume(
  totalBlocks: number,
  block: BlockFormat,
  voidFraction: number = DEFAULT_VOID_FRACTION
): number {
  return totalBlocks * blockVoidVolume(block, voidFraction);
}

export interface ConcreteDosage {
  cementKgPerM3: number;
  sandVolumeRatioPerM3: number;
  gravierVolumeRatioPerM3: number;
}

/** Dosage béton courant "350" pour bourrage/fondations (350 kg/m³ ciment, 0,5 m³/m³ sable, 0,7 m³/m³ gravier). */
export const BETON_DOSAGE_BOURRAGE: ConcreteDosage = {
  cementKgPerM3: 350,
  sandVolumeRatioPerM3: 0.5,
  gravierVolumeRatioPerM3: 0.7,
};

export interface BourrageResult {
  volumeBeton: number; // m³, exact
  cimentKg: number; // exact
  sableM3: number; // exact
  gravierM3: number; // exact
}

/** Ciment, sable et gravier nécessaires pour bourrer un total de blocs d'un même format. */
export function computeBourrage(
  totalBlocks: number,
  block: BlockFormat,
  voidFraction: number = DEFAULT_VOID_FRACTION,
  dosage: ConcreteDosage = BETON_DOSAGE_BOURRAGE
): BourrageResult {
  const volumeBeton = computeBourrageConcreteVolume(totalBlocks, block, voidFraction);
  return {
    volumeBeton,
    cimentKg: volumeBeton * dosage.cementKgPerM3,
    sableM3: volumeBeton * dosage.sandVolumeRatioPerM3,
    gravierM3: volumeBeton * dosage.gravierVolumeRatioPerM3,
  };
}
