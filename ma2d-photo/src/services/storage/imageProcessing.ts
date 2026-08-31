import * as ImageManipulator from 'expo-image-manipulator';

import { formatBaseFileName, formatDateFolder } from '@/utils/dateUtils';
import { listExistingFileNames } from './fileStorage';

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
 * Builds the YYYY-MM-DD_HHmmss[_NN].jpg file name, avoiding collisions
 * when two photos are taken within the same second (spec section 10).
 */
export async function generateUniqueFileName(captureDate: Date = new Date()): Promise<string> {
  const base = formatBaseFileName(captureDate);
  const existing = await listExistingFileNames();

  const plain = `${base}.jpg`;
  if (!existing.has(plain)) return plain;

  for (let suffix = 1; suffix < 100; suffix++) {
    const candidate = `${base}_${suffix.toString().padStart(2, '0')}.jpg`;
    if (!existing.has(candidate)) return candidate;
  }
  // Extremely unlikely fallback: fall back to a millisecond-based suffix.
  return `${base}_${Date.now() % 1000}.jpg`;
}

export function dateFolderFor(captureDate: Date = new Date()): string {
  return formatDateFolder(captureDate);
}
