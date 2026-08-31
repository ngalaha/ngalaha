import * as FileSystem from 'expo-file-system';

const PHOTOS_DIR = `${FileSystem.documentDirectory}ma2d-photos/`;

export async function ensurePhotosDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Copies a captured/picked photo into the app's private storage under its
 * final file name, so it survives even if the OS clears the original
 * camera/picker cache. Returns the new local URI and file size.
 */
export async function persistLocalPhoto(
  sourceUri: string,
  fileName: string
): Promise<{ uri: string; sizeBytes: number }> {
  await ensurePhotosDirectory();
  const destUri = `${PHOTOS_DIR}${fileName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  const info = await FileSystem.getInfoAsync(destUri, { size: true });
  return { uri: destUri, sizeBytes: info.exists && 'size' in info ? info.size ?? 0 : 0 };
}

export async function deleteLocalPhoto(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Non-fatal: a missing local file is not a reason to fail the sync loop.
  }
}

export async function listExistingFileNames(): Promise<Set<string>> {
  await ensurePhotosDirectory();
  const names = await FileSystem.readDirectoryAsync(PHOTOS_DIR);
  return new Set(names);
}
