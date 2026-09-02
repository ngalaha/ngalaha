import { computeTruckOrder, sandVolumeToTonnes } from '../src/calculationEngine/logistics';
import { getTruckType, SAND_DENSITY_T_PER_M3, TRUCK_CATALOG } from '../src/materials/trucks';

const truck10Roues = getTruckType('10-roues')!;
const semiRemorque = getTruckType('semi-remorque')!;

describe('Catalogue de camions', () => {
  it('contient le camion 10 roues (20 t) et la semi-remorque (30 t)', () => {
    expect(truck10Roues.capacityTonnes).toBe(20);
    expect(semiRemorque.capacityTonnes).toBe(30);
    expect(TRUCK_CATALOG).toHaveLength(2);
  });
});

describe('sandVolumeToTonnes', () => {
  it('applique la densité standard du sable (1.6 t/m³)', () => {
    expect(SAND_DENSITY_T_PER_M3).toBe(1.6);
    expect(sandVolumeToTonnes(10)).toBeCloseTo(16, 10);
  });

  it('accepte une densité personnalisée', () => {
    expect(sandVolumeToTonnes(10, 1.5)).toBeCloseTo(15, 10);
  });
});

describe('computeTruckOrder', () => {
  it('calcule un nombre exact de camions 10 roues à partir de tonnes', () => {
    const order = computeTruckOrder(20, truck10Roues);
    expect(order.exactCount).toBeCloseTo(1, 10);
    expect(order.recommendedCount).toBe(1);
  });

  it("atteindre exactement 20 t nécessite un seul camion 10 roues (seuil atteint, pas dépassé)", () => {
    const order = computeTruckOrder(20, truck10Roues);
    expect(order.recommendedCount).toBe(1);
  });

  it('dépasser 20 t de peu nécessite un deuxième camion 10 roues (arrondi entier supérieur)', () => {
    const order = computeTruckOrder(20.5, truck10Roues);
    expect(order.recommendedCount).toBe(2);
  });

  it('une grosse quantité est mieux couverte en semi-remorques (moins de voyages)', () => {
    const tonnes = 60;
    const via10Roues = computeTruckOrder(tonnes, truck10Roues);
    const viaSemi = computeTruckOrder(tonnes, semiRemorque);
    expect(via10Roues.recommendedCount).toBe(3); // 60/20
    expect(viaSemi.recommendedCount).toBe(2); // 60/30
  });

  it('une petite quantité (< 1 camion) arrondit tout de même à 1 camion complet', () => {
    const order = computeTruckOrder(5, truck10Roues);
    expect(order.recommendedCount).toBe(1);
  });
});
