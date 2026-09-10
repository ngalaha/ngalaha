import { SETTINGS_KEYS, getJsonSetting, setJsonSetting } from '@/database/settingsRepository';
import { logger } from '@/services/logging/logger';

/**
 * Per-device preferences, kept in the settings table beside the shared
 * workspace reference. These are deliberately *not* published to the shared
 * configuration: photo quality or a data-saving rule is a choice about this
 * phone and this data plan, not about the team.
 */

export type PhotoQuality = 'high' | 'balanced' | 'light';

export interface AppSettings {
  /** Trade-off between legible detail on site and file size on a data plan. */
  photoQuality: PhotoQuality;
  /** Hold uploads until the phone is on Wi-Fi. */
  wifiOnlyUploads: boolean;
  maxVideoSeconds: number;
  /** Keep the local copy after OneDrive confirms it (uses phone storage). */
  keepLocalAfterUpload: boolean;
}

export const PHOTO_QUALITY_PRESETS: Record<
  PhotoQuality,
  { maxDimension: number; compress: number }
> = {
  // Cracks, rebar and formwork stay legible at 2048 px; "high" is for the
  // rare shot that will be zoomed into, "light" for a phone on a thin plan.
  high: { maxDimension: 3072, compress: 0.9 },
  balanced: { maxDimension: 2048, compress: 0.78 },
  light: { maxDimension: 1280, compress: 0.6 },
};

export const VIDEO_DURATION_CHOICES = [60, 180, 300] as const;

const DEFAULTS: AppSettings = {
  photoQuality: 'balanced',
  wifiOnlyUploads: false,
  maxVideoSeconds: 300,
  keepLocalAfterUpload: false,
};

let cached: AppSettings | null = null;
const listeners = new Set<(settings: AppSettings) => void>();

export function getSettings(): AppSettings {
  if (!cached) {
    const stored = getJsonSetting<Partial<AppSettings>>(SETTINGS_KEYS.appSettings);
    // Merged over the defaults, so a setting added in a later version has a
    // sensible value on a device that was configured before it existed.
    cached = { ...DEFAULTS, ...(stored ?? {}) };
  }
  return cached;
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch };
  cached = next;
  setJsonSetting(SETTINGS_KEYS.appSettings, next);
  logger.info('Paramètres modifiés', patch);
  listeners.forEach((listener) => listener(next));
  return next;
}

export function subscribeSettings(listener: (settings: AppSettings) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
