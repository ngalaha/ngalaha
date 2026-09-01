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

  const { driveId, itemId } = folder;

  try {
    const existing = await graphRequest<GraphDriveItem>({
      path: `/drives/${driveId}/items/${itemId}:/${encodeURIComponent(dateFolderName)}`,
    });
    logger.info('Dossier date existant trouvé', { dateFolderName, id: existing.id });
    return existing.id;
  } catch (e) {
    if (!(e instanceof AppError) || e.userMessage !== USER_MESSAGES.FOLDER_NOT_FOUND) {
      throw e;
    }
  }

  logger.info('Création du dossier date', { dateFolderName });
  const created = await graphRequest<GraphDriveItem>({
    method: 'POST',
    path: `/drives/${driveId}/items/${itemId}/children`,
    body: {
      name: dateFolderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'fail',
    },
  });
  return created.id;
}

async function simpleUpload(
  driveId: string,
  parentItemId: string,
  fileName: string,
  localUri: string
): Promise<GraphDriveItem> {
  const accessToken = await getAccessToken();
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentItemId}:/${encodeURIComponent(
    fileName
  )}:/content`;

  const result = await FileSystem.uploadAsync(url, localUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
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
    body: { item: { '@microsoft.graph.conflictBehavior': 'replace', name: fileName } },
  });

  const base64Content = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = base64Decode(base64Content);

  let offset = 0;
  let lastItem: GraphDriveItem | null = null;
  while (offset < bytes.length) {
    const end = Math.min(offset + UPLOAD_CHUNK_SIZE, bytes.length);
    const chunk = bytes.slice(offset, end);

    const response = await fetch(session.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': String(chunk.length),
        'Content-Range': `bytes ${offset}-${end - 1}/${fileSizeBytes}`,
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
    offset = end;
    logger.info('Progression upload par session', { offset, total: fileSizeBytes });
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
