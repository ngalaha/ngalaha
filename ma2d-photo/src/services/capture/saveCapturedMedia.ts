import { insertPhoto } from '@/database/photosRepository';
import { logger } from '@/services/logging/logger';
import { persistLocalPhoto } from '@/services/storage/fileStorage';
import { compressPhoto, dateFolderFor, generateUniqueFileName } from '@/services/storage/imageProcessing';
import { runSync } from '@/services/upload/uploadQueueService';
import { generateId } from '@/utils/idUtils';
import { sanitizeOneDriveSegment } from '@/utils/oneDriveNaming';
import { MediaType, PhotoRecord } from '@/types';

/** Where a capture belongs — resolved on Home and carried to the camera screen. */
export interface CaptureContext {
  projectId: string;
  projectName: string;
  buildingId: string;
  buildingName: string;
  /** null = "Zone commune" (the building in general, not a specific unit). */
  apartmentId: string | null;
  apartmentName: string | null;
}

/** File extension from a local/picker URI (without the leading dot), or `fallback` if none is found. */
export function extensionFromUri(uri: string, fallback: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? match[1].toLowerCase() : fallback;
}

/**
 * Turns a freshly captured (or picked) file into a queued PhotoRecord:
 * compresses photos, names the file, copies it into the app's own storage,
 * records it and kicks off a sync pass. Shared by the in-app camera and the
 * gallery picker so both produce identical entries.
 */
export async function saveCapturedMedia(
  sourceUri: string,
  mediaType: MediaType,
  context: CaptureContext
): Promise<PhotoRecord> {
  const captureDate = new Date();
  const apartmentPrefix = context.apartmentName
    ? sanitizeOneDriveSegment(context.apartmentName)
    : undefined;

  // Photos get resized/re-encoded for a predictable size and format; videos
  // are used as captured — expo-image-manipulator is image-only, and
  // re-encoding video on-device is far too slow for this app's needs.
  const preparedUri = mediaType === 'video' ? sourceUri : (await compressPhoto(sourceUri)).uri;
  const extension = mediaType === 'video' ? extensionFromUri(sourceUri, 'mp4') : 'jpg';
  const fileName = generateUniqueFileName(captureDate, apartmentPrefix, extension);

  const { uri, sizeBytes } = await persistLocalPhoto(preparedUri, fileName);

  const record: PhotoRecord = {
    id: generateId(),
    projectId: context.projectId,
    projectName: context.projectName,
    buildingId: context.buildingId,
    buildingName: context.buildingName,
    apartmentId: context.apartmentId,
    apartmentName: context.apartmentName,
    mediaType,
    fileName,
    localUri: uri,
    capturedAt: captureDate.toISOString(),
    dateFolder: dateFolderFor(captureDate),
    status: 'PENDING',
    attempts: 0,
    lastError: null,
    uploadedAt: null,
    remoteItemId: null,
    fileSizeBytes: sizeBytes,
  };

  insertPhoto(record);
  logger.info('Media captured', { fileName, mediaType, buildingId: context.buildingId });
  runSync();

  return record;
}
