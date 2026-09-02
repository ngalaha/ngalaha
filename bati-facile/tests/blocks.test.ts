import {
  blocksPerM2,
  computeWallBlocks,
  openingsSurface,
  sumWallsBlocks,
  wallGrossSurface,
  wallNetSurface,
} from '../src/calculationEngine/blocks';
import { BLOCK_CATALOG, getBlockFormat } from '../src/materials/blocks';
import { buildQuantityResult } from '../src/calculationEngine/quantity';
import type { Wall } from '../src/models/Wall';

const block15 = getBlockFormat('15x20x40')!;
const block20 = getBlockFormat('20x20x40')!;
const JOINT = 0.015;

function makeWall(overrides: Partial<Wall> = {}): Wall {
  return {
    id: 'w1',
    label: 'Mur test',
    longueur: 5,
    hauteur: 2.5,
    niveau: 'elevation',
    blockId: block15.id,
    jointEpaisseur: JOINT,
    openings: [],
    bourre: false,
    ...overrides,
  };
}

describe('Catalogue de blocs', () => {
  it('contient les formats standards 10x20x40, 15x20x40, 20x20x40', () => {
    expect(BLOCK_CATALOG.map((b) => b.id).sort()).toEqual(['10x20x40', '15x20x40', '20x20x40']);
  });

  it('les dimensions sont en mètres, correctement converties depuis cm', () => {
    expect(block15.epaisseur).toBeCloseTo(0.15, 10);
    expect(block15.longueur).toBeCloseTo(0.4, 10);
  });
});

describe('blocksPerM2', () => {
  it('calcule le nombre de blocs par m² à partir du format + joint', () => {
    const longueurUtile = block15.longueur + JOINT;
    const hauteurUtile = block15.hauteur + JOINT;
    const expected = 1 / (longueurUtile * hauteurUtile);
    expect(blocksPerM2(block15, JOINT)).toBeCloseTo(expected, 10);
  });

  it('un joint plus épais réduit le nombre de blocs par m²', () => {
    expect(blocksPerM2(block15, 0.02)).toBeLessThan(blocksPerM2(block15, 0.01));
  });
});

describe('Surfaces de mur', () => {
  it('surface brute = longueur × hauteur', () => {
    const wall = makeWall({ longueur: 4, hauteur: 2.5 });
    expect(wallGrossSurface(wall)).toBeCloseTo(10, 10);
  });

  it('déduit correctement une ouverture (porte)', () => {
    const wall = makeWall({
      longueur: 4,
      hauteur: 2.5,
      openings: [{ id: 'o1', largeur: 1, hauteur: 2, quantite: 1 }],
    });
    expect(openingsSurface(wall.openings)).toBeCloseTo(2, 10);
    expect(wallNetSurface(wall)).toBeCloseTo(8, 10);
  });

  it('déduit plusieurs ouvertures identiques via la quantité', () => {
    const wall = makeWall({
      longueur: 10,
      hauteur: 2.5,
      openings: [{ id: 'o1', largeur: 1.2, hauteur: 1.2, quantite: 3 }],
    });
    expect(openingsSurface(wall.openings)).toBeCloseTo(1.2 * 1.2 * 3, 10);
  });
});

describe('computeWallBlocks — calcul exact (sans marge)', () => {
  it('calcule le nombre exact de blocs pour un mur simple', () => {
    const wall = makeWall({ longueur: 5, hauteur: 2.5, openings: [] });
    const result = computeWallBlocks(wall, block15);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const expectedBlocks = wallNetSurface(wall) * blocksPerM2(block15, JOINT);
      expect(result.value.exactBlocks).toBeCloseTo(expectedBlocks, 8);
      expect(result.value.netSurface).toBeCloseTo(12.5, 10);
    }
  });

  it('un mur avec ouvertures a moins de blocs qu\'un mur plein identique', () => {
    const wallPlein = makeWall({ longueur: 6, hauteur: 2.5 });
    const wallAvecPorte = makeWall({
      longueur: 6,
      hauteur: 2.5,
      openings: [{ id: 'o1', largeur: 0.9, hauteur: 2.1, quantite: 1 }],
    });
    const rPlein = computeWallBlocks(wallPlein, block15);
    const rAvecPorte = computeWallBlocks(wallAvecPorte, block15);
    expect(rPlein.ok && rAvecPorte.ok).toBe(true);
    if (rPlein.ok && rAvecPorte.ok) {
      expect(rAvecPorte.value.exactBlocks).toBeLessThan(rPlein.value.exactBlocks);
    }
  });

  it('rejette un mur dont les ouvertures couvrent toute la surface', () => {
    const wall = makeWall({
      longueur: 2,
      hauteur: 2,
      openings: [{ id: 'o1', largeur: 2, hauteur: 2, quantite: 1 }],
    });
    const result = computeWallBlocks(wall, block15);
    expect(result.ok).toBe(false);
  });

  it('rejette des dimensions de mur négatives ou nulles', () => {
    const wall = makeWall({ longueur: 0 });
    const result = computeWallBlocks(wall, block15);
    expect(result.ok).toBe(false);
  });

  it('rejette une quantité d\'ouverture non entière', () => {
    const wall = makeWall({ openings: [{ id: 'o1', largeur: 1, hauteur: 1, quantite: 1.5 }] });
    const result = computeWallBlocks(wall, block15);
    expect(result.ok).toBe(false);
  });

  it('rejette un format de bloc introuvable', () => {
    const wall = makeWall({ blockId: 'inexistant' });
    const result = computeWallBlocks(wall, undefined);
    expect(result.ok).toBe(false);
  });
});

describe('sumWallsBlocks — agrégation multi-murs', () => {
  it('additionne les blocs exacts de plusieurs murs du même format', () => {
    const wallA = makeWall({ id: 'a', longueur: 5, hauteur: 2.5 });
    const wallB = makeWall({ id: 'b', longueur: 3, hauteur: 2.5 });
    const result = sumWallsBlocks([
      { wall: wallA, block: block15 },
      { wall: wallB, block: block15 },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const a = computeWallBlocks(wallA, block15);
      const b = computeWallBlocks(wallB, block15);
      if (a.ok && b.ok) {
        expect(result.value.totalExactBlocks).toBeCloseTo(a.value.exactBlocks + b.value.exactBlocks, 8);
      }
      expect(result.value.totalsByBlock[block15.id].wallCount).toBe(2);
    }
  });

  it('groupe correctement par format de bloc (soubassement 20x20x40 vs élévation 15x20x40)', () => {
    const soubassement = makeWall({ id: 's1', niveau: 'soubassement', blockId: block20.id, longueur: 20, hauteur: 0.6 });
    const elevation = makeWall({ id: 'e1', niveau: 'elevation', blockId: block15.id, longueur: 20, hauteur: 2.5 });
    const result = sumWallsBlocks([
      { wall: soubassement, block: block20 },
      { wall: elevation, block: block15 },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.value.totalsByBlock).sort()).toEqual([block15.id, block20.id].sort());
      expect(result.value.totalsByBlock[block20.id].wallCount).toBe(1);
      expect(result.value.totalsByBlock[block15.id].wallCount).toBe(1);
    }
  });

  it('une erreur sur un mur bloque tout le lot', () => {
    const wallOk = makeWall({ id: 'ok' });
    const wallBad = makeWall({ id: 'bad', longueur: -1 });
    const result = sumWallsBlocks([
      { wall: wallOk, block: block15 },
      { wall: wallBad, block: block15 },
    ]);
    expect(result.ok).toBe(false);
  });
});

describe('Marge de casse et arrondi de commande (buildQuantityResult)', () => {
  it('applique la marge puis arrondit à l\'entier supérieur pour la commande', () => {
    const exact = 140.0;
    const result = buildQuantityResult(exact, 'bloc', 5, { type: 'integer' });
    expect(result.exact).toBe(140);
    expect(result.withMargin).toBeCloseTo(147, 8);
    expect(result.recommended).toBe(147);
  });

  it('arrondit toujours vers le haut, même pour une valeur quasi entière', () => {
    const result = buildQuantityResult(99.001, 'bloc', 0, { type: 'integer' });
    expect(result.recommended).toBe(100);
  });
});
