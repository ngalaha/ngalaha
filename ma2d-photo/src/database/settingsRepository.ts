import { getDb } from './db';

/**
 * Small key/value store for device-level settings that are not domain
 * objects — currently the shared workspace folder and the state of the
 * last configuration sync (see services/sync).
 */

export const SETTINGS_KEYS = {
  workspaceFolder: 'workspace.folder',
  workspaceETag: 'workspace.etag',
  workspaceSyncedAt: 'workspace.syncedAt',
} as const;

export function getSetting(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string | null }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export function setSetting(key: string, value: string | null): void {
  getDb().runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

export function getJsonSetting<T>(key: string): T | null {
  const raw = getSetting(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // A value we cannot parse is a value we cannot trust; treat it as unset
    // rather than crashing the screen that reads it.
    return null;
  }
}

export function setJsonSetting(key: string, value: unknown | null): void {
  setSetting(key, value === null ? null : JSON.stringify(value));
}
