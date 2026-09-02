/**
 * Mortier de pose (jointoiement des blocs) et enduit (crépi).
 *
 * Les ratios de dosage sont des valeurs standards couramment utilisées dans
 * les devis quantitatifs de maçonnerie en Afrique centrale/de l'Ouest —
 * exposées comme constantes ajustables, pas comme vérités figées, car elles
 * varient selon les habitudes locales et le type de mortier souhaité.
 */

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
  volumeMortier: number; // m³, exact
  cimentKg: number; // exact
  sableM3: number; // exact
}

export function computeMortarFromVolume(volumeMortier: number, dosage: MortarDosage): MortarResult {
  return {
    volumeMortier,
    cimentKg: volumeMortier * dosage.cementKgPerM3,
    sableM3: volumeMortier * dosage.sandVolumeRatioPerM3,
  };
}

/** Mortier de pose nécessaire pour jointoyer une surface nette totale de murs en blocs. */
export function computePoseMortar(
  netSurfaceTotal: number,
  volumePerM2: number = DEFAULT_MORTAR_VOLUME_PER_M2_POSE
): MortarResult {
  return computeMortarFromVolume(netSurfaceTotal * volumePerM2, MORTAR_DOSAGE_POSE);
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
