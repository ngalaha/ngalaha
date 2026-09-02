/**
 * Persistance locale générique, entièrement hors ligne, via AsyncStorage.
 * Chaque collection (projets, éléments, historique, favoris) est stockée sous
 * une clé unique en JSON. Aucune connexion Internet requise.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NAMESPACE = '@calcul_chantier';

export function createLocalCollection<T extends { id: string }>(collectionName: string) {
  const key = `${NAMESPACE}/${collectionName}`;

  async function getAll(): Promise<T[]> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      // Données corrompues : on repart d'une collection vide plutôt que de planter l'app.
      return [];
    }
  }

  async function saveAll(items: T[]): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  }

  async function getById(id: string): Promise<T | undefined> {
    const items = await getAll();
    return items.find((item) => item.id === id);
  }

  async function upsert(item: T): Promise<T> {
    const items = await getAll();
    const index = items.findIndex((existing) => existing.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    await saveAll(items);
    return item;
  }

  async function remove(id: string): Promise<void> {
    const items = await getAll();
    await saveAll(items.filter((item) => item.id !== id));
  }

  async function clear(): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  return { getAll, saveAll, getById, upsert, remove, clear };
}
