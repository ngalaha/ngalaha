import { getBuilding, updateBuildingFolder } from '@/database/projectsRepository';
import {
  countPendingPhotos,
  deletePhotoRecord,
  getPhoto,
  incrementAttempts,
  listPendingPhotos,
  updatePhotoStatus,
} from '@/database/photosRepository';
import { AppError, USER_MESSAGES } from '@/utils/errorMessages';
import { logger } from '@/services/logging/logger';
import { ensureDateFolder, uploadPhoto, verifyFolderAccessible } from '@/services/microsoftGraph/oneDriveService';
import { deleteLocalPhoto } from '@/services/storage/fileStorage';

import { isConnected } from './connectivityService';

const MAX_AUTO_ATTEMPTS = 5;

let syncing = false;
const listeners = new Set<() => void>();

export function subscribeQueueChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((l) => l());
}

async function uploadOne(photoId: string): Promise<boolean> {
  const photo = getPhoto(photoId);
  if (!photo) return false;

  updatePhotoStatus(photo.id, 'UPLOADING');
  notify();

  const building = getBuilding(photo.buildingId);
  if (!building || !building.photoFolder.itemId || !building.photoFolder.driveId) {
    updatePhotoStatus(photo.id, 'FAILED', { lastError: USER_MESSAGES.FOLDER_NOT_CONFIGURED });
    logger.error('Bâtiment sans dossier OneDrive configuré', { buildingId: photo.buildingId });
    notify();
    return false;
  }

  try {
    const dateFolderId = await ensureDateFolder(building.photoFolder, photo.dateFolder);
    const { itemId } = await uploadPhoto(
      building.photoFolder.driveId,
      dateFolderId,
      photo.fileName,
      photo.localUri,
      photo.fileSizeBytes ?? 0
    );

    updatePhotoStatus(photo.id, 'UPLOADED', {
      uploadedAt: new Date().toISOString(),
      remoteItemId: itemId,
      lastError: null,
    });
    await deleteLocalPhoto(photo.localUri);
    logger.info('Photo envoyée avec succès', { fileName: photo.fileName, itemId });
    return true;
  } catch (e) {
    const attempts = incrementAttempts(photo.id);
    const message = e instanceof AppError ? e.userMessage : USER_MESSAGES.GENERIC_UPLOAD_FAILURE;
    updatePhotoStatus(photo.id, 'FAILED', { lastError: message, attempts });
    logger.error("Échec de l'envoi de la photo", { fileName: photo.fileName, error: String(e), attempts });

    if (e instanceof AppError && e.userMessage === USER_MESSAGES.SESSION_EXPIRED) {
      throw e; // stop the whole batch — re-login is required
    }
    return false;
  } finally {
    notify();
  }
}

/**
 * Runs the centralized sync pass described in spec section 28:
 * pending photos -> check connectivity -> resolve OneDrive folder ->
 * ensure date folder -> upload -> confirm -> delete local copy.
 * Safe to call repeatedly (e.g. on reconnect, on app foreground, from a
 * background task) — re-entrant calls are ignored while one is running.
 * Returns the number of photos successfully uploaded during this pass, so
 * callers (e.g. the background task) can decide whether to notify the user.
 */
export async function runSync(): Promise<number> {
  // Claim the lock synchronously (before any `await`) so two near-simultaneous
  // callers (e.g. app-start effect + reconnect listener) can't both pass this
  // check and run overlapping upload passes for the same photos.
  if (syncing) return 0;
  syncing = true;
  let uploadedCount = 0;
  try {
    if (!(await isConnected())) {
      logger.info('Synchronisation ignorée : pas de connexion Internet');
      return 0;
    }

    const pending = listPendingPhotos();
    logger.info('Démarrage de la synchronisation', { count: pending.length });

    for (const photo of pending) {
      if (photo.status === 'FAILED' && photo.attempts >= MAX_AUTO_ATTEMPTS) {
        continue; // requires manual "Réessayer" — avoid hammering Graph forever
      }
      if (!(await isConnected())) break;
      try {
        if (await uploadOne(photo.id)) uploadedCount += 1;
      } catch (e) {
        if (e instanceof AppError && e.userMessage === USER_MESSAGES.SESSION_EXPIRED) {
          break; // wait for the user to sign in again
        }
      }
    }
    return uploadedCount;
  } finally {
    syncing = false;
    notify();
  }
}

export async function retryPhoto(photoId: string): Promise<void> {
  updatePhotoStatus(photoId, 'PENDING', { lastError: null });
  notify();
  await runSync();
}

export function isSyncRunning(): boolean {
  return syncing;
}

export function getPendingCount(): number {
  return countPendingPhotos();
}

export async function discardFailedPhoto(photoId: string): Promise<void> {
  const photo = getPhoto(photoId);
  if (!photo) return;
  await deleteLocalPhoto(photo.localUri);
  deletePhotoRecord(photoId);
  notify();
}

/** Re-validates a building's OneDrive folder (used by Administration screen). */
export async function revalidateBuildingFolder(buildingId: string): Promise<void> {
  const building = getBuilding(buildingId);
  if (!building) return;
  const refreshed = await verifyFolderAccessible(building.photoFolder);
  updateBuildingFolder(buildingId, refreshed);
}
