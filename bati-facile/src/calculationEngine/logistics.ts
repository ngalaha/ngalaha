/**
 * Conversion des quantités de matériaux en vrac (sable) vers des camions à
 * commander — pratique pour un chantier qui achète le sable au camion plutôt
 * qu'au sac ou à la brouette une fois la quantité importante.
 */

import { ceilToInteger } from './format';
import { SAND_DENSITY_T_PER_M3, type TruckType } from '../materials/trucks';

/** Convertit un volume de sable (m³) en masse (tonnes), exact, non arrondi. */
export function sandVolumeToTonnes(volumeM3: number, density: number = SAND_DENSITY_T_PER_M3): number {
  return volumeM3 * density;
}

export interface TruckOrder {
  truck: TruckType;
  /** Nombre exact de camions nécessaires, non arrondi. */
  exactCount: number;
  /** Nombre de camions à commander, arrondi à l'entier supérieur. */
  recommendedCount: number;
}

/** Calcule le nombre de camions nécessaires pour transporter une masse donnée. */
export function computeTruckOrder(tonnes: number, truck: TruckType): TruckOrder {
  const exactCount = tonnes / truck.capacityTonnes;
  return { truck, exactCount, recommendedCount: ceilToInteger(exactCount) };
}
