export interface Point {
  x: number;
  y: number;
}

/** Distance euclidienne entre deux points, dans l'unité de leurs coordonnées (ex: pixels écran). */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}
