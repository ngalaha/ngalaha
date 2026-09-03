/**
 * Core domain types for MA2D Construction photo app.
 */

/** A construction project (e.g. "Champfleury"). */
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reference to a OneDrive folder identified via Microsoft Graph.
 * itemId + driveId are the durable reference used for uploads;
 * shareUrl is kept only for display/re-validation purposes.
 */
export interface OneDriveFolderRef {
  shareUrl: string | null;
  driveId: string | null;
  itemId: string | null;
  itemName: string | null;
  webUrl: string | null;
  /** Set when the folder has been resolved and verified reachable via Graph. */
  verifiedAt: string | null;
  /** Set when the last verification attempt failed. */
  lastError: string | null;
}

export function emptyOneDriveFolderRef(): OneDriveFolderRef {
  return {
    shareUrl: null,
    driveId: null,
    itemId: null,
    itemName: null,
    webUrl: null,
    verifiedAt: null,
    lastError: null,
  };
}

/** A building within a project (e.g. "Bâtiment A"). */
export interface Building {
  id: string;
  projectId: string;
  name: string;
  photoFolder: OneDriveFolderRef;
  createdAt: string;
  updatedAt: string;
}

/**
 * An apartment/unit within a building (e.g. "101"). Unlike a building's
 * photoFolder (an admin-provided OneDrive link), an apartment's folder is
 * created automatically by the app, inside the building's photoFolder, the
 * first time a photo is uploaded for it — folder starts unresolved (all
 * fields null) and is filled in and cached once that happens.
 */
export interface Apartment {
  id: string;
  buildingId: string;
  name: string;
  folder: OneDriveFolderRef;
  createdAt: string;
  updatedAt: string;
}

export type PhotoStatus = 'LOCAL' | 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'FAILED';

/** A photo captured on-site, tracked through its upload lifecycle. */
export interface PhotoRecord {
  id: string;
  projectId: string;
  projectName: string;
  buildingId: string;
  buildingName: string;
  /** Set when the photo was taken for a specific apartment rather than the building in general ("Zone commune"). */
  apartmentId: string | null;
  apartmentName: string | null;
  /** File name assigned at capture time: [apartmentName_]YYYY-MM-DD_HHmmss[_NN].jpg */
  fileName: string;
  /** Absolute local URI (expo-file-system) of the (compressed) photo. */
  localUri: string;
  /** ISO date the photo was captured. */
  capturedAt: string;
  /** YYYY-MM-DD date folder this photo belongs to (local time of capture). */
  dateFolder: string;
  status: PhotoStatus;
  /** Number of upload attempts made so far. */
  attempts: number;
  /** Last error message (French, user-facing) if status is FAILED. */
  lastError: string | null;
  /** Set once the upload succeeds. */
  uploadedAt: string | null;
  /** OneDrive item id of the uploaded file, once known. */
  remoteItemId: string | null;
  fileSizeBytes: number | null;
}

export interface MicrosoftAccount {
  homeAccountId: string;
  username: string;
  name: string | null;
}
