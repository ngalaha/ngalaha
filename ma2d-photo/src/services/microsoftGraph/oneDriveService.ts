import * as FileSystem from 'expo-file-system';

import { AppError, USER_MESSAGES } from '@/utils/errorMessages';
import { base64Decode, encodeSharingUrl } from '@/utils/base64';
import { logger } from '@/services/logging/logger';
import { OneDriveFolderRef } from '@/types';

import { graphRequest } from './graphClient';
import { getAccessToken } from './authService';

interface GraphDriveItem {
  id: string;
  name: string;
  webUrl: string;
  folder?: { childCount: number };
  parentReference?: { driveId: string };
}

const SIMPLE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024; // Graph limit for PUT .../content
const UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024; // must be a multiple of 320 KiB per Graph docs

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

/** Best-effort Content-Type for a captured photo or video, from its file extension. */
function mimeTypeForFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

/**
 * Resolves an administrator-provided OneDrive sharing link (any "Copy
 * link" URL from OneDrive/SharePoint) into a durable Drive ID + Item ID
 * pair via Microsoft Graph's /shares endpoint (spec section 6).
 */
export async function resolveShareLink(shareUrl: string): Promise<OneDriveFolderRef> {
  const trimmed = shareUrl.trim();
  logger.info('Résolution du lien OneDrive', { shareUrl: trimmed });

  try {
    const encoded = encodeSharingUrl(trimmed);
    const item = await graphRequest<GraphDriveItem>({
      path: `/shares/${encoded}/driveItem?$select=id,name,webUrl,folder,parentReference`,
    });

    if (!item.folder) {
      throw new AppError(
        "⚠️ Ce lien ne pointe pas vers un dossier OneDrive (mais vers un fichier).",
        'Shared item is not a folder'
      );
    }

    const driveId = item.parentReference?.driveId;
    if (!driveId) {
      throw new AppError(USER_MESSAGES.INVALID_SHARE_LINK, 'Missing parentReference.driveId');
    }

    return {
      shareUrl: trimmed,
      driveId,
      itemId: item.id,
      itemName: item.name,
      webUrl: item.webUrl,
      verifiedAt: new Date().toISOString(),
      lastError: null,
    };
  } catch (e) {
    // A 404 here means the /shares lookup itself failed (bad/expired link),
    // not that a resolved OneDrive folder went missing — report it as such.
    const message =
      e instanceof AppError
        ? e.userMessage === USER_MESSAGES.FOLDER_NOT_FOUND
          ? USER_MESSAGES.INVALID_SHARE_LINK
          : e.userMessage
        : USER_MESSAGES.INVALID_SHARE_LINK;
    logger.error('Échec de résolution du lien OneDrive', { shareUrl: trimmed, error: String(e) });
    return {
      shareUrl: trimmed,
      driveId: null,
      itemId: null,
      itemName: null,
      webUrl: null,
      verifiedAt: null,
      lastError: message,
    };
  }
}

/** Re-checks that a previously resolved folder is still reachable. */
export async function verifyFolderAccessible(folder: OneDriveFolderRef): Promise<OneDriveFolderRef> {
  if (!folder.driveId || !folder.itemId) {
    return { ...folder, lastError: USER_MESSAGES.FOLDER_NOT_CONFIGURED };
  }
  try {
    const item = await graphRequest<GraphDriveItem>({
      path: `/drives/${folder.driveId}/items/${folder.itemId}?$select=id,name,webUrl,folder`,
    });
    return {
      ...folder,
      itemName: item.name,
      webUrl: item.webUrl,
      verifiedAt: new Date().toISOString(),
      lastError: null,
    };
  } catch (e) {
    const message = e instanceof AppError ? e.userMessage : USER_MESSAGES.FOLDER_NOT_FOUND;
    return { ...folder, lastError: message };
  }
}

/** Finds (or creates) a direct child folder by exact name and returns it. */
async function findOrCreateChildFolder(
  driveId: string,
  parentItemId: string,
  name: string
): Promise<GraphDriveItem> {
  try {
    const existing = await graphRequest<GraphDriveItem>({
      path: `/drives/${driveId}/items/${parentItemId}:/${encodeURIComponent(name)}`,
    });
    logger.info('Dossier existant trouvé', { name, id: existing.id });
    return existing;
  } catch (e) {
    if (!(e instanceof AppError) || e.userMessage !== USER_MESSAGES.FOLDER_NOT_FOUND) {
      throw e;
    }
  }

  logger.info('Création du dossier', { name });
  return graphRequest<GraphDriveItem>({
    method: 'POST',
    path: `/drives/${driveId}/items/${parentItemId}/children`,
    body: {
      name,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'fail',
    },
  });
}

/**
 * Finds (or creates) the YYYY-MM-DD sub-folder inside the building's
 * Photo folder and returns its Item ID (spec section 12).
 */
export async function ensureDateFolder(
  folder: OneDriveFolderRef,
  dateFolderName: string
): Promise<string> {
  if (!folder.driveId || !folder.itemId) {
    throw new AppError(USER_MESSAGES.FOLDER_NOT_CONFIGURED, 'Building has no OneDrive folder configured');
  }
  const item = await findOrCreateChildFolder(folder.driveId, folder.itemId, dateFolderName);
  return item.id;
}

/**
 * Finds (or creates) an apartment's own sub-folder directly inside the
 * building's Photo folder — apartment folders are flat siblings of the
 * date folders used for "Zone commune" photos, created automatically the
 * first time a photo for that apartment is uploaded, and reused after.
 */
export async function ensureApartmentFolder(
  buildingFolder: OneDriveFolderRef,
  apartmentName: string
): Promise<{ itemId: string; webUrl: string }> {
  if (!buildingFolder.driveId || !buildingFolder.itemId) {
    throw new AppError(USER_MESSAGES.FOLDER_NOT_CONFIGURED, 'Building has no OneDrive folder configured');
  }
  const item = await findOrCreateChildFolder(buildingFolder.driveId, buildingFolder.itemId, apartmentName);
  return { itemId: item.id, webUrl: item.webUrl };
}

async function simpleUpload(
  driveId: string,
  parentItemId: string,
  fileName: string,
  localUri: string
): Promise<GraphDriveItem> {
  const accessToken = await getAccessToken();
  // conflictBehavior=rename: file names are already made unique locally
  // (millisecond timestamp), but if a same-name file somehow already
  // exists in this folder (e.g. local history was reset), this makes
  // OneDrive save the new photo under an auto-renamed name instead of
  // silently overwriting — or failing — on the collision.
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentItemId}:/${encodeURIComponent(
    fileName
  )}:/content?@microsoft.graph.conflictBehavior=rename`;

  const result = await FileSystem.uploadAsync(url, localUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeTypeForFileName(fileName),
    },
  });

  if (result.status < 200 || result.status >= 300) {
    logger.error('Échec upload simple OneDrive', { status: result.status, body: result.body });
    const message = result.status === 403 ? USER_MESSAGES.AUTHORIZATION_PENDING : USER_MESSAGES.ONEDRIVE_ACCESS_ERROR;
    throw new AppError(message, `Upload failed: ${result.status}`);
  }
  return JSON.parse(result.body) as GraphDriveItem;
}

async function sessionUpload(
  driveId: string,
  parentItemId: string,
  fileName: string,
  localUri: string,
  fileSizeBytes: number
): Promise<GraphDriveItem> {
  const session = await graphRequest<{ uploadUrl: string }>({
    method: 'POST',
    path: `/drives/${driveId}/items/${parentItemId}:/${encodeURIComponent(fileName)}:/createUploadSession`,
    // See simpleUpload() above for why 'rename' rather than 'replace': never
    // silently overwrite or fail on a same-name collision.
    body: { item: { '@microsoft.graph.conflictBehavior': 'rename', name: fileName } },
  });

  // Read the real size from disk rather than trusting the queued record:
  // a wrong total here would truncate the upload or loop forever.
  const info = await FileSystem.getInfoAsync(localUri, { size: true });
  const totalBytes = info.exists && 'size' in info ? (info.size ?? fileSizeBytes) : fileSizeBytes;
  if (totalBytes <= 0) {
    throw new AppError(USER_MESSAGES.GENERIC_UPLOAD_FAILURE, `Empty or unreadable file: ${localUri}`);
  }

  let offset = 0;
  let lastItem: GraphDriveItem | null = null;
  while (offset < totalBytes) {
    // One chunk at a time, read straight from disk at `offset`. Reading the
    // whole file up front (as this used to) means holding the entire video in
    // memory as base64 + bytes — fine for a 2 MB photo, an out-of-memory
    // crash for a 100 MB video.
    const base64Chunk = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: offset,
      length: Math.min(UPLOAD_CHUNK_SIZE, totalBytes - offset),
    });
    const chunk = base64Decode(base64Chunk);
    if (chunk.length === 0) {
      throw new AppError(USER_MESSAGES.GENERIC_UPLOAD_FAILURE, `Read 0 bytes at offset ${offset}`);
    }

    const response = await fetch(session.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': String(chunk.length),
        'Content-Range': `bytes ${offset}-${offset + chunk.length - 1}/${totalBytes}`,
      },
      body: chunk,
    });

    if (!response.ok && response.status !== 202) {
      const text = await response.text().catch(() => '');
      logger.error('Échec upload par session OneDrive', { status: response.status, body: text });
      const message =
        response.status === 403 ? USER_MESSAGES.AUTHORIZATION_PENDING : USER_MESSAGES.ONEDRIVE_ACCESS_ERROR;
      throw new AppError(message, `Session upload failed: ${response.status}`);
    }
    if (response.status !== 202) {
      lastItem = (await response.json()) as GraphDriveItem;
    }
    offset += chunk.length;
    logger.info('Progression upload par session', { offset, total: totalBytes });
  }

  if (!lastItem) {
    throw new AppError(USER_MESSAGES.ONEDRIVE_ACCESS_ERROR, 'Upload session completed without final item');
  }
  return lastItem;
}

/**
 * Uploads a photo into the given (already-resolved) date folder.
 * Uses a simple PUT for files under Graph's 4 MB limit for that
 * endpoint, and a resumable upload session otherwise (spec section 33).
 */
export async function uploadPhoto(
  driveId: string,
  dateFolderItemId: string,
  fileName: string,
  localUri: string,
  fileSizeBytes: number
): Promise<{ itemId: string; webUrl: string }> {
  logger.info('Upload started', { fileName, fileSizeBytes });
  const item =
    fileSizeBytes <= SIMPLE_UPLOAD_MAX_BYTES
      ? await simpleUpload(driveId, dateFolderItemId, fileName, localUri)
      : await sessionUpload(driveId, dateFolderItemId, fileName, localUri, fileSizeBytes);
  logger.info('Upload completed', { fileName, itemId: item.id });
  return { itemId: item.id, webUrl: item.webUrl };
}

/**
 * Small JSON documents living beside the photos, in a OneDrive folder —
 * how the app shares its configuration between phones without a server
 * (see services/sync/configSyncService).
 *
 * Both helpers go through fetch directly rather than graphRequest: the
 * caller needs the file's eTag, which is a response header/field the
 * generic wrapper does not surface.
 */
export interface RemoteJsonFile<T> {
  content: T;
  eTag: string | null;
}

function itemContentUrl(driveId: string, parentItemId: string, fileName: string): string {
  return `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentItemId}:/${encodeURIComponent(
    fileName
  )}:`;
}

/** Reads a JSON file from a folder. Returns null when it does not exist yet. */
export async function readJsonFile<T>(
  driveId: string,
  parentItemId: string,
  fileName: string
): Promise<RemoteJsonFile<T> | null> {
  const accessToken = await getAccessToken();
  const base = itemContentUrl(driveId, parentItemId, fileName);

  const metaResponse = await fetch(`${base}?$select=id,eTag`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (metaResponse.status === 404) return null;
  if (!metaResponse.ok) {
    const text = await metaResponse.text().catch(() => '');
    throw new AppError(
      USER_MESSAGES.ONEDRIVE_ACCESS_ERROR,
      `Graph ${metaResponse.status} reading ${fileName}: ${text}`,
      undefined,
      metaResponse.status
    );
  }
  const meta = (await metaResponse.json()) as { eTag?: string };

  const contentResponse = await fetch(`${base}/content`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (contentResponse.status === 404) return null;
  if (!contentResponse.ok) {
    const text = await contentResponse.text().catch(() => '');
    throw new AppError(
      USER_MESSAGES.ONEDRIVE_ACCESS_ERROR,
      `Graph ${contentResponse.status} downloading ${fileName}: ${text}`,
      undefined,
      contentResponse.status
    );
  }

  const raw = await contentResponse.text();
  try {
    return { content: JSON.parse(raw) as T, eTag: meta.eTag ?? null };
  } catch (e) {
    throw new AppError(
      USER_MESSAGES.ONEDRIVE_ACCESS_ERROR,
      `${fileName} is not valid JSON`,
      e
    );
  }
}

/**
 * Writes a JSON file into a folder, refusing to overwrite a version we
 * have not seen: pass the eTag read earlier, or null when we believe the
 * file does not exist yet. A 409/412 means someone else wrote in the
 * meantime — the caller re-reads and replays its change rather than
 * silently discarding theirs.
 */
export async function writeJsonFile(
  driveId: string,
  parentItemId: string,
  fileName: string,
  content: unknown,
  eTag: string | null
): Promise<string | null> {
  const accessToken = await getAccessToken();
  const conflictBehavior = eTag ? 'replace' : 'fail';
  const url = `${itemContentUrl(driveId, parentItemId, fileName)}/content?@microsoft.graph.conflictBehavior=${conflictBehavior}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  if (eTag) headers['If-Match'] = eTag;

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(content, null, 2),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    logger.warn("Échec de l'écriture du fichier de configuration", {
      status: response.status,
      fileName,
      body: text,
    });
    throw new AppError(
      USER_MESSAGES.ONEDRIVE_ACCESS_ERROR,
      `Graph ${response.status} writing ${fileName}: ${text}`,
      undefined,
      response.status
    );
  }

  const item = (await response.json()) as { eTag?: string };
  return item.eTag ?? null;
}
