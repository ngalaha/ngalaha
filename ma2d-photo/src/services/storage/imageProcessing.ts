import * as ImageManipulator from 'expo-image-manipulator';

import { fileNameExists } from '@/database/photosRepository';
import { formatBaseFileName, formatDateFolder } from '@/utils/dateUtils';

const MAX_DIMENSION = 2048; // preserves cracks/rebar/formwork detail while capping file size
const JPEG_QUALITY = 0.78;

/**
 * Resizes (if needed) and re-encodes a photo as JPEG at a quality level
 * tuned for construction-site documentation: legible cracks, rebar,
 * formwork and equipment details without unnecessarily huge files
 * (spec section 11).
 */
export async function compressPhoto(uri: string): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result;
}

/**
 * Builds the [apartmentPrefix_]YYYY-MM-DD_HHmmss[_NN].jpg file name,
 * avoiding collisions when two photos are taken within the same second
 * (spec section 10). When an apartment is selected, its (already
 * OneDrive-sanitized) name is prepended so the file self-identifies its
 * apartment and date even outside its OneDrive folder.
 *
 * Checked against the local database (every photo ever captured), not the
 * local file system: an already-uploaded photo's local file is deleted
 * once confirmed in OneDrive (spec section 26), so checking the file
 * system alone would miss it and let a later photo silently reuse — and
 * overwrite — its name.
 */
export function generateUniqueFileName(
  captureDate: Date = new Date(),
  apartmentPrefix?: string,
  extension: string = 'jpg'
): string {
  const base = formatBaseFileName(captureDate);
  const stem = apartmentPrefix ? `${apartmentPrefix}_${base}` : base;

  const plain = `${stem}.${extension}`;
  if (!fileNameExists(plain)) return plain;

  for (let suffix = 1; suffix < 100; suffix++) {
    const candidate = `${stem}_${suffix.toString().padStart(2, '0')}.${extension}`;
    if (!fileNameExists(candidate)) return candidate;
  }
  // Extremely unlikely fallback: fall back to a millisecond-based suffix.
  return `${stem}_${Date.now() % 1000}.${extension}`;
}

export function dateFolderFor(captureDate: Date = new Date()): string {
  return formatDateFolder(captureDate);
}
