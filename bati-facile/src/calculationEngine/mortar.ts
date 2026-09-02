/**
 * Mortier de pose (jointoiement des blocs) et enduit (crépi).
 *
 * Pour la pose en élévation NON bourrée, la méthode de référence est un ratio
 * terrain confirmé (`BlockFormat.blocksPerCementBagPose`, ex: 140 parpaings de
 * 15 cm par sac de ciment ⇒ 3 brouettes de sable par sac) — bien plus fiable
 * qu'une estimation volumétrique. Cette dernière (`computePoseMortar`) ne sert
 * que de repli lorsque le ratio terrain n'est pas encore confirmé pour un
 * format de bloc donné.
 */

import type { BlockFormat } from '../materials/blocks';

/** Ratio terrain confirmé : brouettes de sable par sac de ciment de 50 kg, pour la pose en élévation non bourrée. */
export const SABLE_BROUETTES_PAR_SAC_POSE = 3;

/**
 * Volume estimé d'une brouette de chantier standard — approximation usuelle,
 * PAS un ratio terrain confirmé. Sert uniquement à donner un équivalent m³
 * indicatif ; la quantité de référence pour l'achat reste le nombre de
 * brouettes.
 */
export const BROUETTE_VOLUME_M3_ESTIME = 0.065;

export interface MortarDosage {
  /** Dosage en kg de ciment par m³ de mortier. */
  cementKgPerM3: number;
  /** Volume de sable (m³) par m³ de mortier, avec foisonnement. */
  sandVolumeRatioPerM3: number;
}

/** Dosage courant pour le mortier de pose des blocs (≈ 300 kg/m³, dosage 1:4). */
export const MORTAR_DOSAGE_POSE: MortarDosage = { cementKgPerM3: 300, sandVolumeRatioPerM3: 1.0 };

/** Dosage courant pour l'enduit/crépi, plus riche (≈ 400 kg/m³, dosage 1:3). */
export const MORTAR_DOSAGE_ENDUIT: MortarDosage = { cementKgPerM3: 400, sandVolumeRatioPerM3: 1.0 };

export const CEMENT_BAG_KG = 50;

/** Volume de mortier de pose par m² de mur en blocs creux standard (valeur usuelle). */
export const DEFAULT_MORTAR_VOLUME_PER_M2_POSE = 0.025;

/** Épaisseur d'enduit courante par couche. */
export const DEFAULT_ENDUIT_THICKNESS_M = 0.015;

export interface MortarResult {
  volumeMortier: number; // m³, exact (estimation quand dérivé d'un ratio terrain)
  cimentKg: number; // exact
  sableM3: number; // exact ou estimé, voir sableBrouettes
  /** Présent uniquement quand le sable est dérivé d'un ratio terrain confirmé (brouettes/sac). */
  sableBrouettes?: number;
}

export function computeMortarFromVolume(volumeMortier: number, dosage: MortarDosage): MortarResult {
  return {
    volumeMortier,
    cimentKg: volumeMortier * dosage.cementKgPerM3,
    sableM3: volumeMortier * dosage.sandVolumeRatioPerM3,
  };
}

/**
 * Mortier de pose nécessaire pour jointoyer une surface nette totale de murs
 * en blocs — méthode volumétrique de repli, utilisée uniquement quand aucun
 * ratio terrain n'est confirmé pour le format de bloc (voir `computePoseMortarForBlockCount`).
 */
export function computePoseMortar(
  netSurfaceTotal: number,
  volumePerM2: number = DEFAULT_MORTAR_VOLUME_PER_M2_POSE
): MortarResult {
  return computeMortarFromVolume(netSurfaceTotal * volumePerM2, MORTAR_DOSAGE_POSE);
}

/** Nombre exact de sacs de ciment à partir d'un ratio terrain "blocs par sac". */
export function poseCementBagsFromBlockCount(totalBlocks: number, blocksPerBag: number): number {
  return totalBlocks / blocksPerBag;
}

/**
 * Mortier de pose pour un total de blocs d'un format donné, en priorité via le
 * ratio terrain confirmé (`block.blocksPerCementBagPose`). Retourne `undefined`
 * si aucun ratio n'est confirmé pour ce format — dans ce cas, utiliser
 * `computePoseMortar` (surface nette) comme estimation de repli.
 */
export function computePoseMortarForBlockCount(totalBlocks: number, block: BlockFormat): MortarResult | undefined {
  if (block.blocksPerCementBagPose === undefined) return undefined;
  const sacs = poseCementBagsFromBlockCount(totalBlocks, block.blocksPerCementBagPose);
  const cimentKg = sacs * CEMENT_BAG_KG;
  const sableBrouettes = sacs * SABLE_BROUETTES_PAR_SAC_POSE;
  return {
    volumeMortier: cimentKg / MORTAR_DOSAGE_POSE.cementKgPerM3,
    cimentKg,
    sableBrouettes,
    sableM3: sableBrouettes * BROUETTE_VOLUME_M3_ESTIME,
  };
}

/** Mortier d'enduit pour une surface donnée (intérieure, extérieure, ou les deux additionnées) et une épaisseur choisie. */
export function computeEnduitMortar(
  surface: number,
  epaisseur: number = DEFAULT_ENDUIT_THICKNESS_M
): MortarResult {
  return computeMortarFromVolume(surface * epaisseur, MORTAR_DOSAGE_ENDUIT);
}

/** Nombre exact de sacs de ciment de 50 kg (non arrondi — arrondir à l'affichage/commande). */
export function cementBagsExact(cimentKg: number): number {
  return cimentKg / CEMENT_BAG_KG;
}
