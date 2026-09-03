import { getDb } from './db';
import { PhotoRecord, PhotoStatus } from '@/types';

export function insertPhoto(photo: PhotoRecord): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO photos
      (id, projectId, projectName, buildingId, buildingName, apartmentId, apartmentName, mediaType, fileName,
       localUri, capturedAt, dateFolder, status, attempts, lastError, uploadedAt, remoteItemId, fileSizeBytes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    photo.id,
    photo.projectId,
    photo.projectName,
    photo.buildingId,
    photo.buildingName,
    photo.apartmentId,
    photo.apartmentName,
    photo.mediaType,
    photo.fileName,
    photo.localUri,
    photo.capturedAt,
    photo.dateFolder,
    photo.status,
    photo.attempts,
    photo.lastError,
    photo.uploadedAt,
    photo.remoteItemId,
    photo.fileSizeBytes
  );
}

export function listRecentPhotos(limit = 30): PhotoRecord[] {
  const db = getDb();
  return db.getAllSync<PhotoRecord>(
    'SELECT * FROM photos ORDER BY capturedAt DESC LIMIT ?',
    limit
  );
}

export function listPendingPhotos(): PhotoRecord[] {
  const db = getDb();
  return db.getAllSync<PhotoRecord>(
    `SELECT * FROM photos WHERE status IN ('PENDING', 'FAILED') ORDER BY capturedAt ASC`
  );
}

export function countPendingPhotos(): number {
  const db = getDb();
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM photos WHERE status IN ('PENDING', 'UPLOADING', 'FAILED')`
  );
  return row?.count ?? 0;
}

export function updatePhotoStatus(
  id: string,
  status: PhotoStatus,
  fields: Partial<Pick<PhotoRecord, 'lastError' | 'uploadedAt' | 'remoteItemId' | 'attempts'>> = {}
): void {
  const db = getDb();
  const current = db.getFirstSync<PhotoRecord>('SELECT * FROM photos WHERE id = ?', id);
  if (!current) return;
  const merged = { ...current, status, ...fields };
  db.runSync(
    `UPDATE photos SET status = ?, attempts = ?, lastError = ?, uploadedAt = ?, remoteItemId = ? WHERE id = ?`,
    merged.status,
    merged.attempts,
    merged.lastError,
    merged.uploadedAt,
    merged.remoteItemId,
    id
  );
}

export function incrementAttempts(id: string): number {
  const db = getDb();
  db.runSync('UPDATE photos SET attempts = attempts + 1 WHERE id = ?', id);
  const row = db.getFirstSync<{ attempts: number }>(
    'SELECT attempts FROM photos WHERE id = ?',
    id
  );
  return row?.attempts ?? 0;
}

export function deletePhotoRecord(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM photos WHERE id = ?', id);
}

export function getPhoto(id: string): PhotoRecord | null {
  const db = getDb();
  return db.getFirstSync<PhotoRecord>('SELECT * FROM photos WHERE id = ?', id);
}

/**
 * Whether a file name has ever been used, including for photos already
 * uploaded (and therefore no longer present in local storage) — the
 * collision check in imageProcessing.ts must survive a photo's local copy
 * being deleted right after a successful upload (spec section 26/10).
 */
export function fileNameExists(fileName: string): boolean {
  const db = getDb();
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM photos WHERE fileName = ?',
    fileName
  );
  return (row?.count ?? 0) > 0;
}
