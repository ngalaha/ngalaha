import { createLocalCollection } from './localCollection';
import { generateId, nowIso } from '../utils/id';
import type { ConcreteElementInput } from '../calculationEngine/concrete';
import type { PanelCalcInput } from '../calculationEngine/panels';

export type FavoriteEntry =
  | { id: string; kind: 'concrete'; label: string; input: ConcreteElementInput; createdAt: string }
  | { id: string; kind: 'panel'; label: string; input: PanelCalcInput; createdAt: string };

const favoritesDb = createLocalCollection<FavoriteEntry>('favorites');

export async function listFavorites(): Promise<FavoriteEntry[]> {
  const items = await favoritesDb.getAll();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addFavorite(entry: Omit<FavoriteEntry, 'id' | 'createdAt'>): Promise<FavoriteEntry> {
  const favorite = { ...entry, id: generateId(), createdAt: nowIso() } as FavoriteEntry;
  return favoritesDb.upsert(favorite);
}

export async function removeFavorite(id: string): Promise<void> {
  await favoritesDb.remove(id);
}
