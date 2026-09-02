import {
  BETON_DOSAGE_BOURRAGE,
  blockGrossVolume,
  blockVoidVolume,
  computeBourrage,
  computeBourrageConcreteVolume,
  DEFAULT_VOID_FRACTION,
} from '../src/calculationEngine/bourrage';
import { getBlockFormat } from '../src/materials/blocks';

const block15 = getBlockFormat('15x20x40')!;
const block20 = getBlockFormat('20x20x40')!;

describe('Volume brut et volume des alvéoles', () => {
  it('volume brut = épaisseur × hauteur × longueur', () => {
    expect(blockGrossVolume(block20)).toBeCloseTo(0.2 * 0.2 * 0.4, 10);
    expect(blockGrossVolume(block15)).toBeCloseTo(0.15 * 0.2 * 0.4, 10);
  });

  it('le taux de vide par défaut est de 55% (valeur médiane 50-60%, NF EN 771-3)', () => {
    expect(DEFAULT_VOID_FRACTION).toBe(0.55);
  });

  it('volume à bourrer = volume brut × taux de vide', () => {
    expect(blockVoidVolume(block20)).toBeCloseTo(blockGrossVolume(block20) * 0.55, 10);
    expect(blockVoidVolume(block15)).toBeCloseTo(blockGrossVolume(block15) * 0.55, 10);
  });

  it('accepte un taux de vide personnalisé (ajustable, valeur non figée)', () => {
    expect(blockVoidVolume(block20, 0.5)).toBeCloseTo(blockGrossVolume(block20) * 0.5, 10);
  });

  it('un bloc 20x20x40 nécessite plus de béton de bourrage qu\'un 15x20x40 (plus épais)', () => {
    expect(blockVoidVolume(block20)).toBeGreaterThan(blockVoidVolume(block15));
  });
});

describe('computeBourrageConcreteVolume — multi-blocs', () => {
  it('multiplie le volume par bloc par le nombre total de blocs', () => {
    const total = computeBourrageConcreteVolume(100, block20);
    expect(total).toBeCloseTo(100 * blockVoidVolume(block20), 8);
  });
});

describe('computeBourrage — ciment/sable/gravier', () => {
  it('applique le dosage béton "350" (350 kg/m³ ciment, 0.5 sable, 0.7 gravier)', () => {
    expect(BETON_DOSAGE_BOURRAGE.cementKgPerM3).toBe(350);
    expect(BETON_DOSAGE_BOURRAGE.sandVolumeRatioPerM3).toBe(0.5);
    expect(BETON_DOSAGE_BOURRAGE.gravierVolumeRatioPerM3).toBe(0.7);
  });

  it('calcule ciment, sable et gravier à partir du volume de béton de bourrage', () => {
    const result = computeBourrage(100, block20);
    const expectedVolume = computeBourrageConcreteVolume(100, block20);
    expect(result.volumeBeton).toBeCloseTo(expectedVolume, 8);
    expect(result.cimentKg).toBeCloseTo(expectedVolume * 350, 6);
    expect(result.sableM3).toBeCloseTo(expectedVolume * 0.5, 8);
    expect(result.gravierM3).toBeCloseTo(expectedVolume * 0.7, 8);
  });

  it('accepte un dosage personnalisé', () => {
    const customDosage = { cementKgPerM3: 300, sandVolumeRatioPerM3: 0.45, gravierVolumeRatioPerM3: 0.75 };
    const result = computeBourrage(50, block15, DEFAULT_VOID_FRACTION, customDosage);
    const expectedVolume = computeBourrageConcreteVolume(50, block15);
    expect(result.cimentKg).toBeCloseTo(expectedVolume * 300, 6);
  });
});
