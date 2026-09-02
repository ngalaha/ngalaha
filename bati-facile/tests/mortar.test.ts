import {
  CEMENT_BAG_KG,
  cementBagsExact,
  computeEnduitMortar,
  computePoseMortar,
  DEFAULT_ENDUIT_THICKNESS_M,
  DEFAULT_MORTAR_VOLUME_PER_M2_POSE,
  MORTAR_DOSAGE_ENDUIT,
  MORTAR_DOSAGE_POSE,
} from '../src/calculationEngine/mortar';

describe('Mortier de pose', () => {
  it('calcule le volume de mortier à partir de la surface nette totale', () => {
    const result = computePoseMortar(10);
    expect(result.volumeMortier).toBeCloseTo(10 * DEFAULT_MORTAR_VOLUME_PER_M2_POSE, 10);
  });

  it('applique le dosage ciment standard (300 kg/m³)', () => {
    const result = computePoseMortar(10);
    expect(result.cimentKg).toBeCloseTo(result.volumeMortier * MORTAR_DOSAGE_POSE.cementKgPerM3, 8);
  });

  it('accepte un volume de mortier par m² personnalisé', () => {
    const result = computePoseMortar(10, 0.03);
    expect(result.volumeMortier).toBeCloseTo(0.3, 10);
  });
});

describe('Enduit (crépi)', () => {
  it('calcule le volume à partir de la surface et de l\'épaisseur', () => {
    const result = computeEnduitMortar(20, 0.015);
    expect(result.volumeMortier).toBeCloseTo(20 * 0.015, 10);
  });

  it('utilise l\'épaisseur par défaut si non spécifiée', () => {
    const result = computeEnduitMortar(20);
    expect(result.volumeMortier).toBeCloseTo(20 * DEFAULT_ENDUIT_THICKNESS_M, 10);
  });

  it('applique un dosage ciment plus riche que le mortier de pose', () => {
    expect(MORTAR_DOSAGE_ENDUIT.cementKgPerM3).toBeGreaterThan(MORTAR_DOSAGE_POSE.cementKgPerM3);
  });
});

describe('Sacs de ciment', () => {
  it('calcule un nombre exact (non arrondi) de sacs de 50 kg', () => {
    expect(cementBagsExact(150)).toBeCloseTo(3, 10);
    expect(cementBagsExact(75)).toBeCloseTo(1.5, 10);
    expect(CEMENT_BAG_KG).toBe(50);
  });
});
