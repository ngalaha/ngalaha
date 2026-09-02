/**
 * Calculateurs de Superficie / Longueur / Volume (cahier des charges §11).
 * Toutes les dimensions en entrée et les résultats sont en unités SI (m, m², m³),
 * exacts et non arrondis.
 */

export function rectangleArea(longueur: number, largeur: number): number {
  return longueur * largeur;
}

export function rectanglePerimeter(longueur: number, largeur: number): number {
  return 2 * (longueur + largeur);
}

export function triangleArea(base: number, hauteur: number): number {
  return (base * hauteur) / 2;
}

export function circleAreaFromDiameter(diametre: number): number {
  const rayon = diametre / 2;
  return Math.PI * rayon * rayon;
}

export function circleAreaFromRadius(rayon: number): number {
  return Math.PI * rayon * rayon;
}

export function circleCircumference(diametre: number): number {
  return Math.PI * diametre;
}

/** Volume d'un prisme rectangulaire (boîte) : L × l × H. */
export function boxVolume(longueur: number, largeur: number, hauteur: number): number {
  return longueur * largeur * hauteur;
}

export function cylinderVolume(diametre: number, hauteur: number): number {
  return circleAreaFromDiameter(diametre) * hauteur;
}
