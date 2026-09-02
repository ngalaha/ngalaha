import { computeQuickCalc } from '../src/calculationEngine/calculations';

describe('Calcul Rapide', () => {
  it("exemple du cahier des charges : 12'-6\" × 8'-4\" × 5\" -> volume en m³", () => {
    // Converties en amont par measurementParser : 12'-6" = 3.81 m, 8'-4" = 2.5400266... m, 5" = 0.127 m
    const l = 3.81;
    const w = 2.5400266667; // 8*0.3048 + 4*0.0254
    const e = 0.127;
    const result = computeQuickCalc({ mode: 'volumeSimple', longueur: l, largeur: w, epaisseur: e });
    expect(result.ok).toBe(true);
    if (result.ok && result.value.mode === 'volumeSimple') {
      expect(result.value.volume).toBeCloseTo(l * w * e, 8);
    }
  });

  it('mode surface : L × l', () => {
    const result = computeQuickCalc({ mode: 'surface', longueur: 4, largeur: 3 });
    expect(result.ok).toBe(true);
    if (result.ok && result.value.mode === 'surface') {
      expect(result.value.surface).toBeCloseTo(12, 10);
    }
  });

  it('mode conversion : pieds vers mètres', () => {
    const result = computeQuickCalc({ mode: 'conversion', valeur: 10, from: 'ft', to: 'm' });
    expect(result.ok).toBe(true);
    if (result.ok && result.value.mode === 'conversion') {
      expect(result.value.value).toBeCloseTo(3.048, 10);
    }
  });

  it('mode addition de plusieurs volumes', () => {
    const result = computeQuickCalc({ mode: 'additionVolumes', volumes: [1.5, 2.25, 0.75] });
    expect(result.ok).toBe(true);
    if (result.ok && result.value.mode === 'additionVolumes') {
      expect(result.value.total).toBeCloseTo(4.5, 10);
      expect(result.value.count).toBe(3);
    }
  });

  it('rejette une addition de volumes vide', () => {
    const result = computeQuickCalc({ mode: 'additionVolumes', volumes: [] });
    expect(result.ok).toBe(false);
  });

  it('rejette des dimensions invalides pour un volume', () => {
    const result = computeQuickCalc({ mode: 'volume', longueur: -1, largeur: 2, hauteur: 3 });
    expect(result.ok).toBe(false);
  });

  it('ne perd jamais de précision sur une chaîne de conversions aller-retour', () => {
    const result1 = computeQuickCalc({ mode: 'conversion', valeur: 123.456, from: 'm', to: 'ft' });
    expect(result1.ok).toBe(true);
    if (!result1.ok || result1.value.mode !== 'conversion') throw new Error('unexpected');
    const result2 = computeQuickCalc({ mode: 'conversion', valeur: result1.value.value, from: 'ft', to: 'm' });
    expect(result2.ok).toBe(true);
    if (result2.ok && result2.value.mode === 'conversion') {
      expect(result2.value.value).toBeCloseTo(123.456, 9);
    }
  });
});
