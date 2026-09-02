/**
 * Catalogue des blocs (parpaings) courants en Afrique centrale/de l'Ouest.
 * Dimensions données comme épaisseur × hauteur × longueur, en mètres (SI).
 *
 * Ces dimensions sont des standards largement répandus au Cameroun, Gabon,
 * Congo-Brazzaville, RDC et Côte d'Ivoire, mais varient légèrement selon les
 * fabricants locaux — c'est pourquoi le catalogue reste entièrement
 * modifiable (voir `WallLevel` pour la suggestion par défaut, jamais imposée).
 */

export type WallLevel = 'soubassement' | 'elevation' | 'cloison';

export interface BlockFormat {
  id: string;
  /** Libellé usuel du marché, ex "15x20x40". */
  label: string;
  epaisseur: number; // m
  hauteur: number; // m
  longueur: number; // m
  usageRecommande: WallLevel[];
  /**
   * Ratio terrain confirmé : nombre de parpaings montés (pose simple, joints
   * NON bourrés) par sac de ciment de 50 kg. `undefined` = ratio non confirmé
   * pour ce format, le moteur retombe alors sur une estimation volumétrique.
   *
   * Ce ratio concerne uniquement le jointoiement (pose). Le bourrage
   * (remplissage des alvéoles au béton) est une décision indépendante du
   * format — un 15×20×40 comme un 20×20×40 peuvent tous deux être posés
   * bourrés en fondation. Voir `Wall.bourre` et `calculationEngine/bourrage.ts`.
   */
  blocksPerCementBagPose?: number;
}

export const BLOCK_CATALOG: BlockFormat[] = [
  {
    id: '10x20x40',
    label: '10×20×40',
    epaisseur: 0.1,
    hauteur: 0.2,
    longueur: 0.4,
    usageRecommande: ['cloison'],
  },
  {
    id: '15x20x40',
    label: '15×20×40',
    epaisseur: 0.15,
    hauteur: 0.2,
    longueur: 0.4,
    usageRecommande: ['elevation', 'soubassement'],
    blocksPerCementBagPose: 140, // confirmé terrain : 1 sac de ciment monte 140 parpaings de 15 cm non bourrés
  },
  {
    id: '20x20x40',
    label: '20×20×40',
    epaisseur: 0.2,
    hauteur: 0.2,
    longueur: 0.4,
    usageRecommande: ['soubassement', 'elevation'],
  },
];

export function getBlockFormat(id: string): BlockFormat | undefined {
  return BLOCK_CATALOG.find((b) => b.id === id);
}

/** Suggestion par défaut selon le niveau — modifiable par l'utilisateur, jamais imposée. */
export function defaultBlockForLevel(level: WallLevel): BlockFormat {
  const match = BLOCK_CATALOG.find((b) => b.usageRecommande.includes(level));
  return match ?? BLOCK_CATALOG[1];
}

export const DEFAULT_JOINT_EPAISSEUR_M = 0.015; // 1.5 cm, pratique courante
export const DEFAULT_WASTE_MARGIN_PERCENT = 5;
export const WASTE_MARGIN_PRESETS = [3, 5, 7, 10] as const;
