import {
  FEET_TO_M,
  INCH_TO_M,
  M_TO_FEET_REF,
  M3_TO_FT3_REF,
  FT3_TO_M3_REF,
  FT2_TO_M2_REF,
  feetToMeters,
  inchesToMeters,
  metersToFeet,
  metersToInches,
  feetInchesToMeters,
  m2ToFt2,
  ft2ToM2,
  m3ToFt3,
  ft3ToM3,
  lengthToMeters,
  metersToLength,
} from '../src/calculationEngine/conversions';
import { parseMeasurement } from '../src/calculationEngine/measurementParser';
import { formatFeetInches, roundTo, ceilToStep, ceilToInteger } from '../src/calculationEngine/format';

describe('conversions — constantes exactes', () => {
  it('1 pied = 0.3048 m exactement', () => {
    expect(FEET_TO_M).toBe(0.3048);
  });

  it('1 pouce = 0.0254 m exactement', () => {
    expect(INCH_TO_M).toBe(0.0254);
  });

  it('feetToMeters / inchesToMeters correspondent au cahier des charges', () => {
    expect(feetToMeters(1)).toBeCloseTo(0.3048, 10);
    expect(inchesToMeters(1)).toBeCloseTo(0.0254, 10);
  });

  it('metersToFeet correspond à la constante de référence 3.280839895', () => {
    expect(metersToFeet(1)).toBeCloseTo(M_TO_FEET_REF, 6);
  });

  it('m3ToFt3 correspond à la constante de référence 35.3146667', () => {
    expect(m3ToFt3(1)).toBeCloseTo(M3_TO_FT3_REF, 4);
  });

  it('ft3ToM3 correspond à la constante de référence 0.0283168466', () => {
    expect(ft3ToM3(1)).toBeCloseTo(FT3_TO_M3_REF, 8);
  });

  it('ft2ToM2 correspond à la constante de référence 0.09290304', () => {
    expect(ft2ToM2(1)).toBeCloseTo(FT2_TO_M2_REF, 10);
  });

  it('les conversions sont mathématiquement réversibles (aller-retour exact)', () => {
    const original = 12.3456789;
    expect(metersToFeet(feetToMeters(original))).toBeCloseTo(original, 12);
    expect(metersToInches(inchesToMeters(original))).toBeCloseTo(original, 12);
    expect(ft2ToM2(m2ToFt2(original))).toBeCloseTo(original, 10);
    expect(ft3ToM3(m3ToFt3(original))).toBeCloseTo(original, 8);
  });

  it("feetInchesToMeters (12'-6\") = 3.8100 m", () => {
    // 12 pi = 3.6576 m, 6 po = 0.1524 m -> total 3.81 m exact
    expect(feetInchesToMeters(12, 6)).toBeCloseTo(3.81, 10);
  });

  it('lengthToMeters/metersToLength gèrent toutes les unités du clavier de mesure', () => {
    expect(lengthToMeters(100, 'cm')).toBeCloseTo(1, 10);
    expect(lengthToMeters(1000, 'mm')).toBeCloseTo(1, 10);
    expect(metersToLength(1, 'cm')).toBeCloseTo(100, 10);
    expect(metersToLength(1, 'mm')).toBeCloseTo(1000, 10);
  });
});

describe('measurementParser — saisie pieds + pouces intelligente', () => {
  const cases: Array<[string, number]> = [
    ["12'-6\"", 3.81],
    ["12' 6\"", 3.81],
    ['12 pi 6 po', 3.81],
    ['12-6', 3.81],
    ['12.5 pi', feetToMeters(12.5)],
    ['150"', inchesToMeters(150)],
    ['3.81 m', 3.81],
  ];

  it.each(cases)('parse "%s" -> %f m', (input, expected) => {
    const result = parseMeasurement(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meters).toBeCloseTo(expected, 9);
    }
  });

  it('accepte la virgule décimale (notation québécoise)', () => {
    const result = parseMeasurement('12,5 pi');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meters).toBeCloseTo(feetToMeters(12.5), 9);
  });

  it('traite un nombre nu comme des pieds', () => {
    const result = parseMeasurement('10');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meters).toBeCloseTo(feetToMeters(10), 9);
  });

  it('rejette une entrée vide', () => {
    expect(parseMeasurement('').ok).toBe(false);
    expect(parseMeasurement('   ').ok).toBe(false);
  });

  it('rejette un format non reconnu', () => {
    const result = parseMeasurement('abc');
    expect(result.ok).toBe(false);
  });

  it('rejette des pouces >= 12 dans une combinaison pieds-pouces', () => {
    const result = parseMeasurement("5'-15\"");
    expect(result.ok).toBe(false);
  });
});

describe('format — arrondi uniquement à l\'affichage', () => {
  it('roundTo arrondit correctement sans dérive flottante', () => {
    expect(roundTo(1.005, 2)).toBeCloseTo(1.01, 5);
    expect(roundTo(2.5, 0)).toBe(3);
  });

  it('ceilToStep arrondit vers le haut au multiple demandé', () => {
    expect(ceilToStep(1.01, 0.25)).toBeCloseTo(1.25, 10);
    expect(ceilToStep(1.25, 0.25)).toBeCloseTo(1.25, 10);
    expect(ceilToStep(2.51, 0.5)).toBeCloseTo(3, 10);
  });

  it('ceilToInteger arrondit toujours vers le haut', () => {
    expect(ceilToInteger(4.001)).toBe(5);
    expect(ceilToInteger(4)).toBe(4);
  });

  it("formatFeetInches convertit 3.81 m en 12'-6\"", () => {
    expect(formatFeetInches(3.81)).toBe('12\'-6"');
  });
});
