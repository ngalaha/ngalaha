import { computePanelCount, panelSurface, STANDARD_PANEL_FORMATS } from '../src/calculationEngine/panels';
import { feetToMeters } from '../src/calculationEngine/conversions';

describe('Calculateur Panneaux', () => {
  it('surface d\'un panneau 4x8 en m²', () => {
    const surface = panelSurface(STANDARD_PANEL_FORMATS['4x8']);
    expect(surface).toBeCloseTo(feetToMeters(4) * feetToMeters(8), 10);
  });

  it('nombre théorique = surface totale ÷ surface du panneau', () => {
    const format = STANDARD_PANEL_FORMATS['4x8'];
    const surfaceTotale = panelSurface(format) * 5.4; // 5.4 panneaux théoriques
    const result = computePanelCount({ materialType: 'osb', surfaceTotale, format, marginPercent: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.exact).toBeCloseTo(5.4, 8);
      expect(result.value.recommended).toBe(6); // arrondi entier supérieur
    }
  });

  it('applique la marge de perte avant l\'arrondi entier supérieur', () => {
    const format = STANDARD_PANEL_FORMATS['4x8'];
    const surfaceTotale = panelSurface(format) * 4; // exactement 4 panneaux
    const result = computePanelCount({ materialType: 'osb', surfaceTotale, format, marginPercent: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.exact).toBeCloseTo(4, 8);
      expect(result.value.withMargin).toBeCloseTo(4.4, 8);
      expect(result.value.recommended).toBe(5); // 4.4 -> arrondi à 5
    }
  });

  it('arrondit toujours à l\'entier supérieur, même pour une valeur quasi entière', () => {
    const format = STANDARD_PANEL_FORMATS['4x8'];
    const surfaceTotale = panelSurface(format) * 3.001;
    const result = computePanelCount({ materialType: 'contreplaque', surfaceTotale, format, marginPercent: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.recommended).toBe(4);
  });

  it('rejette une surface totale négative ou nulle', () => {
    const result = computePanelCount({
      materialType: 'osb',
      surfaceTotale: 0,
      format: STANDARD_PANEL_FORMATS['4x8'],
      marginPercent: 5,
    });
    expect(result.ok).toBe(false);
  });

  it('accepte un format personnalisé', () => {
    const format = { label: 'Custom', largeur: 1, longueur: 2 };
    const result = computePanelCount({ materialType: 'personnalise', surfaceTotale: 10, format, marginPercent: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.recommended).toBe(5); // 10 / (1*2) = 5
  });
});
