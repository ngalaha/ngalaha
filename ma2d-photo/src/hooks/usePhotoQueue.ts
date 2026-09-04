import { useCallback, useEffect, useState } from 'react';

import { listRecentPhotos } from '@/database/photosRepository';
import {
  discardFailedPhoto,
  getPendingCount,
  isSyncRunning,
  retryPhoto,
  runSync,
  subscribeQueueChanges,
} from '@/services/upload/uploadQueueService';
import { PhotoRecord } from '@/types';

export function usePhotoQueue() {
  const [recentPhotos, setRecentPhotos] = useState<PhotoRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    setRecentPhotos(listRecentPhotos());
    setPendingCount(getPendingCount());
    setSyncing(isSyncRunning());
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeQueueChanges(refresh);
    return unsubscribe;
  }, [refresh]);

  return {
    recentPhotos,
    pendingCount,
    syncing,
    refresh,
    triggerSync: runSync,
    retryPhoto,
    discardPhoto: discardFailedPhoto,
  };
}
