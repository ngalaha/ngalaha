/**
 * Camions de livraison pour matériaux en vrac (sable, gravier) et densité du
 * sable de construction — pour convertir une quantité en m³ vers un nombre
 * de camions à commander.
 *
 * Sources : camion 10 roues ≈ 20 t (marché camerounais, ex. livraisons de
 * sable en 10 roues à 20 t) ; semi-remorque benne ≈ 30 t de charge utile ;
 * densité du sable de construction ≈ 1,6 t/m³ (valeur standard).
 */

export interface TruckType {
  id: string;
  label: string;
  capacityTonnes: number;
}

export const TRUCK_CATALOG: TruckType[] = [
  { id: '10-roues', label: 'Camion 10 roues (~20 t)', capacityTonnes: 20 },
  { id: 'semi-remorque', label: 'Semi-remorque (~30 t)', capacityTonnes: 30 },
];

export function getTruckType(id: string): TruckType | undefined {
  return TRUCK_CATALOG.find((t) => t.id === id);
}

/** Densité standard du sable de construction, en tonnes par m³ — ajustable selon le sable local. */
export const SAND_DENSITY_T_PER_M3 = 1.6;

/** Seuil à partir duquel il devient pertinent de commander en camion plutôt qu'au sac/à la brouette. */
export const TRUCK_ORDER_THRESHOLD_TONNES = 20;
