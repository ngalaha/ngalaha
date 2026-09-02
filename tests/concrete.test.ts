import { computeConcreteVolume, sumConcreteElements, type ConcreteElementInput } from '../src/calculationEngine/concrete';

describe('Calculateur Béton — volumes exacts', () => {
  it('semelle filante : L × l × e', () => {
    const input: ConcreteElementInput = { type: 'semelleFilante', dims: { longueur: 10, largeur: 0.6, epaisseur: 0.2 } };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(1.2, 10);
  });

  it('mur de fondation : L × H × e', () => {
    const input: ConcreteElementInput = { type: 'murFondation', dims: { longueur: 20, hauteur: 2.4, epaisseur: 0.25 } };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(12, 10);
  });

  it('poteau carré : côté² × hauteur', () => {
    const input: ConcreteElementInput = { type: 'poteauCarre', dims: { cote: 0.4, hauteur: 3 } };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(0.48, 10);
  });

  it('poteau circulaire : π × r² × hauteur', () => {
    const input: ConcreteElementInput = { type: 'poteauCirculaire', dims: { diametre: 0.5, hauteur: 3 } };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(Math.PI * 0.25 * 0.25 * 3, 10);
  });

  it('escalier : volume triangulaire cumulé sur les marches', () => {
    const input: ConcreteElementInput = {
      type: 'escalier',
      dims: { nombreMarches: 10, giron: 0.28, hauteurMarche: 0.18, largeur: 1.0 },
    };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(10 * ((0.28 * 0.18) / 2) * 1.0, 10);
  });

  it('élément personnalisé : L × l × H', () => {
    const input: ConcreteElementInput = { type: 'personnalise', dims: { longueur: 1, largeur: 1, hauteur: 1 } };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(1, 10);
  });

  it('rejette les dimensions négatives ou nulles', () => {
    const input: ConcreteElementInput = { type: 'dalleSimple', dims: { longueur: 0, largeur: 3, epaisseur: 0.1 } };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejette les dimensions non finies (NaN)', () => {
    const input: ConcreteElementInput = { type: 'dalleSimple', dims: { longueur: NaN, largeur: 3, epaisseur: 0.1 } };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(false);
  });

  it("rejette un nombre de marches non entier", () => {
    const input: ConcreteElementInput = {
      type: 'escalier',
      dims: { nombreMarches: 3.5, giron: 0.28, hauteurMarche: 0.18, largeur: 1 },
    };
    const result = computeConcreteVolume(input);
    expect(result.ok).toBe(false);
  });

  it('système multi-éléments : additionne automatiquement tous les volumes', () => {
    const inputs: ConcreteElementInput[] = [
      { type: 'semelleFilante', dims: { longueur: 10, largeur: 0.6, epaisseur: 0.2 } },
      { type: 'dalleSimple', dims: { longueur: 5, largeur: 4, epaisseur: 0.1 } },
      { type: 'poteauCarre', dims: { cote: 0.3, hauteur: 2.5 } },
    ];
    const result = sumConcreteElements(inputs);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const expected = 10 * 0.6 * 0.2 + 5 * 4 * 0.1 + 0.3 * 0.3 * 2.5;
      expect(result.value.totalVolume).toBeCloseTo(expected, 10);
      expect(result.value.elements).toHaveLength(3);
    }
  });

  it('multi-éléments : une erreur sur un élément bloque tout le lot avec un message explicite', () => {
    const inputs: ConcreteElementInput[] = [
      { type: 'semelleFilante', dims: { longueur: 10, largeur: 0.6, epaisseur: 0.2 } },
      { type: 'dalleSimple', dims: { longueur: -1, largeur: 4, epaisseur: 0.1 } },
    ];
    const result = sumConcreteElements(inputs);
    expect(result.ok).toBe(false);
  });
});
