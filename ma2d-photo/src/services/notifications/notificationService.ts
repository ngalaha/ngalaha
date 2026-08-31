import * as Notifications from 'expo-notifications';

import { logger } from '@/services/logging/logger';

/**
 * Local notifications only (spec section 1) — no push server, no Expo
 * push token involved. Used to confirm to the user that photos taken
 * while they were away from the app (offline, or after a background
 * sync) have actually reached OneDrive, since they won't be watching the
 * screen for the status badges in that case.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let permissionDeniedThisSession = false;

async function ensurePermission(): Promise<boolean> {
  if (permissionDeniedThisSession) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  if (!requested.granted) {
    permissionDeniedThisSession = true;
    return false;
  }
  return true;
}

/** Fires a local notification once `count` photos have finished uploading. */
export async function notifyUploadsCompleted(count: number): Promise<void> {
  if (count <= 0) return;
  try {
    const granted = await ensurePermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MA2D Construction',
        body: `${count} photo${count > 1 ? 's' : ''} envoyée${count > 1 ? 's' : ''} dans OneDrive.`,
      },
      trigger: null,
    });
  } catch (e) {
    logger.warn('Impossible d’afficher la notification locale', { error: String(e) });
  }
}
