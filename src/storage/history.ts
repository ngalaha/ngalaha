import { createLocalCollection } from './localCollection';
import { generateId, nowIso } from '../utils/id';
import type { QuickCalcInput, QuickCalcResult } from '../calculationEngine/calculations';

export interface HistoryEntry {
  id: string;
  input: QuickCalcInput;
  result: QuickCalcResult;
  createdAt: string;
}

const historyDb = createLocalCollection<HistoryEntry>('history');
const MAX_HISTORY_ENTRIES = 100;

export async function listHistory(): Promise<HistoryEntry[]> {
  const items = await historyDb.getAll();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addHistoryEntry(input: QuickCalcInput, result: QuickCalcResult): Promise<HistoryEntry> {
  const entry: HistoryEntry = { id: generateId(), input, result, createdAt: nowIso() };
  const items = await historyDb.getAll();
  items.push(entry);
  const trimmed = items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_HISTORY_ENTRIES);
  await historyDb.saveAll(trimmed);
  return entry;
}

export async function clearHistory(): Promise<void> {
  await historyDb.clear();
}

export async function removeHistoryEntry(id: string): Promise<void> {
  await historyDb.remove(id);
}
