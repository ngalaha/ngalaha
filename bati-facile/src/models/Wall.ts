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
  label: string;
  longueur: number; // m, exact
  hauteur: number; // m, exact
  niveau: WallLevel;
  blockId: string; // référence vers BLOCK_CATALOG
  jointEpaisseur: number; // m, exact (défaut 0.015)
  openings: Opening[];
}
