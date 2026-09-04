import { readLocalSnapshot, writeLocalSnapshot } from '@/database/configRepository';
import { pruneOldDeletions } from '@/database/deletionsRepository';
import { SETTINGS_KEYS, getJsonSetting, getSetting, setJsonSetting, setSetting } from '@/database/settingsRepository';
import { logger } from '@/services/logging/logger';
import { getCurrentAccount } from '@/services/microsoftGraph/authService';
import { readJsonFile, resolveShareLink, writeJsonFile } from '@/services/microsoftGraph/oneDriveService';
import { AppError } from '@/utils/errorMessages';
import { OneDriveFolderRef } from '@/types';

import {
  CONFIG_FILE_NAME,
  CONFIG_VERSION,
  WorkspaceConfig,
  configToSnapshot,
  isSameConfiguration,
  mergeSnapshots,
  snapshotToConfig,
} from './workspaceConfig';

/**
 * Keeps the projects/buildings/apartments of every phone in step, through
 * a single JSON file in a shared OneDrive folder ("l'espace partagé").
 *
 * There is no server: each device merges what it knows with that file and
 * writes the result back. Conflicting writes are caught by the file's eTag
 * — a phone that would overwrite a version it never saw re-reads and
 * replays its own change instead.
 */

export type SyncStatus = 'not-configured' | 'synced' | 'unchanged' | 'error';

export interface SyncResult {
  status: SyncStatus;
  message?: string;
}

export interface SyncState {
  syncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}

/** A remote write rejected because someone else wrote first. */
const CONFLICT_STATUSES = [409, 412];
/** Home asks for a sync on every focus; this keeps it from hammering Graph. */
const MIN_AUTO_SYNC_INTERVAL_MS = 60 * 1000;

let syncing = false;
let lastAutoSyncAt = 0;
let lastError: string | null = null;
const listeners = new Set<() => void>();

export function subscribeSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function getWorkspaceFolder(): OneDriveFolderRef | null {
  return getJsonSetting<OneDriveFolderRef>(SETTINGS_KEYS.workspaceFolder);
}

export function isWorkspaceConfigured(): boolean {
  const folder = getWorkspaceFolder();
  return !!folder?.driveId && !!folder.itemId;
}

export function getSyncState(): SyncState {
  return {
    syncing,
    lastSyncedAt: getSetting(SETTINGS_KEYS.workspaceSyncedAt),
    lastError,
  };
}

/**
 * Points this phone at the shared folder. The link is pasted once per
 * device — everything else (projects, buildings, apartments, and each
 * building's Photo folder) then arrives on its own.
 */
export async function setWorkspaceFromShareLink(shareUrl: string): Promise<OneDriveFolderRef> {
  const folder = await resolveShareLink(shareUrl);
  setJsonSetting(SETTINGS_KEYS.workspaceFolder, folder);
  // A different folder means a different configuration document; the eTag
  // we remembered belongs to the old one.
  setSetting(SETTINGS_KEYS.workspaceETag, null);
  logger.info('Espace partagé configuré', { itemName: folder.itemName });
  notify();
  return folder;
}

export function clearWorkspace(): void {
  setJsonSetting(SETTINGS_KEYS.workspaceFolder, null);
  setSetting(SETTINGS_KEYS.workspaceETag, null);
  setSetting(SETTINGS_KEYS.workspaceSyncedAt, null);
  logger.info('Espace partagé retiré');
  notify();
}

function emptyRemote(): WorkspaceConfig {
  return {
    version: CONFIG_VERSION,
    updatedAt: new Date(0).toISOString(),
    updatedBy: null,
    projects: [],
    buildings: [],
    apartments: [],
    deletions: [],
  };
}

/** One merge round: read the shared file, merge, save locally, publish. */
async function syncOnce(driveId: string, itemId: string): Promise<SyncResult> {
  const remoteFile = await readJsonFile<WorkspaceConfig>(driveId, itemId, CONFIG_FILE_NAME);
  const remoteConfig = remoteFile?.content ?? emptyRemote();

  if ((remoteConfig.version ?? 0) > CONFIG_VERSION) {
    // Written by a newer version of the app: reading it could silently drop
    // fields this build knows nothing about, so leave it alone.
    const message =
      "L'espace partagé a été écrit par une version plus récente de l'application. Mettez l'application à jour avant de synchroniser.";
    logger.warn('Configuration partagée trop récente', {
      remoteVersion: remoteConfig.version,
      appVersion: CONFIG_VERSION,
    });
    return { status: 'error', message };
  }

  const merged = mergeSnapshots(readLocalSnapshot(), configToSnapshot(remoteConfig));
  writeLocalSnapshot(merged);
  pruneOldDeletions();

  const account = await getCurrentAccount();
  const mergedConfig = snapshotToConfig(merged, account?.username ?? null);

  if (remoteFile && isSameConfiguration(mergedConfig, remoteFile.content)) {
    setSetting(SETTINGS_KEYS.workspaceETag, remoteFile.eTag);
    return { status: 'unchanged' };
  }

  const eTag = await writeJsonFile(
    driveId,
    itemId,
    CONFIG_FILE_NAME,
    mergedConfig,
    remoteFile?.eTag ?? null
  );
  setSetting(SETTINGS_KEYS.workspaceETag, eTag);
  return { status: 'synced' };
}

/**
 * Merges this phone with the shared configuration and publishes the result.
 * Safe to call at any time: it is a no-op when no shared folder is set up,
 * and never runs twice at once.
 */
export async function syncNow(): Promise<SyncResult> {
  const folder = getWorkspaceFolder();
  if (!folder?.driveId || !folder.itemId) return { status: 'not-configured' };
  if (syncing) return { status: 'unchanged' };

  syncing = true;
  lastError = null;
  notify();
  try {
    const result = await syncOnce(folder.driveId, folder.itemId);
    lastError = result.status === 'error' ? (result.message ?? null) : null;
    if (result.status !== 'error') markSynced();
    return result;
  } catch (e) {
    if (e instanceof AppError && e.status && CONFLICT_STATUSES.includes(e.status)) {
      // Someone published between our read and our write. Their version is
      // now the base; merging again replays our change on top of theirs.
      logger.info('Conflit de synchronisation — nouvelle tentative');
      try {
        const retry = await syncOnce(folder.driveId, folder.itemId);
        lastError = retry.status === 'error' ? (retry.message ?? null) : null;
        if (retry.status !== 'error') markSynced();
        return retry;
      } catch (retryError) {
        return recordFailure(retryError);
      }
    }
    return recordFailure(e);
  } finally {
    syncing = false;
    notify();
  }
}

/** Only a round that actually completed counts as "last synchronised". */
function markSynced(): void {
  setSetting(SETTINGS_KEYS.workspaceSyncedAt, new Date().toISOString());
}

function recordFailure(error: unknown): SyncResult {
  const message = error instanceof AppError ? error.userMessage : 'Synchronisation impossible.';
  logger.error('Échec de la synchronisation de la configuration', { error: String(error) });
  lastError = message;
  return { status: 'error', message };
}

/**
 * Fire-and-forget sync used after an administration change and when the
 * home screen regains focus — throttled, and silent about its failures
 * (the queue and the Administration screen surface them instead).
 */
export function syncSoon(force = false): void {
  if (!isWorkspaceConfigured()) return;
  const now = Date.now();
  if (!force && now - lastAutoSyncAt < MIN_AUTO_SYNC_INTERVAL_MS) return;
  lastAutoSyncAt = now;
  syncNow().catch(() => {
    // Already logged by syncNow.
  });
}
