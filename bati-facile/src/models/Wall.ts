import type { WallLevel } from '../materials/blocks';

export interface Opening {
  id: string;
  label?: string;
  largeur: number; // m, exact
  hauteur: number; // m, exact
  quantite: number; // nombre d'ouvertures identiques (ex: 3 fenêtres identiques)
}

export interface Wall {
  id: string;
  projectId: string;
  label: string;
  longueur: number; // m, exact
  hauteur: number; // m, exact
  niveau: WallLevel;
  blockId: string; // référence vers BLOCK_CATALOG
  jointEpaisseur: number; // m, exact (défaut 0.015)
  openings: Opening[];
  /**
   * true = les alvéoles des blocs de ce mur sont bourrées au béton (pratique
   * courante en soubassement/fondation, quel que soit le format de bloc
   * utilisé — 15×20×40 ou 20×20×40). Indépendant du format du bloc : c'est
   * une décision de mise en œuvre, pas une propriété du bloc lui-même.
   */
  bourre: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
}
