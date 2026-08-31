import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { logger } from '@/services/logging/logger';
import { notifyUploadsCompleted } from '@/services/notifications/notificationService';

import { runSync } from './uploadQueueService';

export const BACKGROUND_SYNC_TASK = 'MA2D_BACKGROUND_SYNC';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    logger.info('Tâche de synchronisation en arrière-plan déclenchée');
    const uploadedCount = await runSync();
    // Notify only from the background path: in the foreground the user
    // already sees the status badges update live (spec section 1/18).
    await notifyUploadsCompleted(uploadedCount);
    return uploadedCount > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (e) {
    logger.error('Échec de la tâche de synchronisation en arrière-plan', { error: String(e) });
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registers the background sync task. Actual OS scheduling frequency is
 * not guaranteed (iOS/Android both throttle background execution) — this
 * is a best-effort complement to the foreground/on-reconnect sync, not a
 * replacement for it (spec section 15).
 */
export async function registerBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) return;
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // seconds; OS decides the real cadence
      stopOnTerminate: false,
      startOnBoot: true,
    });
    logger.info('Synchronisation en arrière-plan enregistrée');
  } catch (e) {
    logger.warn('Impossible d’enregistrer la synchronisation en arrière-plan', { error: String(e) });
  }
}
