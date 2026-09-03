const INVALID_ONEDRIVE_CHARS = /["*:<>?/\\|]/g;

/**
 * Strips characters OneDrive forbids in file/folder names and trims
 * trailing dots/spaces (Windows/OneDrive rejects both). Used for apartment
 * names, which come from free-text admin input but end up as both a
 * OneDrive folder name and part of a photo file name.
 */
export function sanitizeOneDriveSegment(name: string): string {
  const cleaned = name.replace(INVALID_ONEDRIVE_CHARS, '').trim().replace(/[. ]+$/, '');
  return cleaned || 'Sans-nom';
}
