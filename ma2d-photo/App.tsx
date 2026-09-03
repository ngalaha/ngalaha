import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from '@/database/db';
import { ensureSeeded } from '@/database/projectsRepository';
import RootNavigator from '@/navigation/RootNavigator';
import { registerBackgroundSync } from '@/services/upload/backgroundSyncTask';
import { subscribeOnReconnect } from '@/services/upload/connectivityService';
import { runSync } from '@/services/upload/uploadQueueService';
import { logger } from '@/services/logging/logger';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      initDatabase();
      ensureSeeded();
      setReady(true);
      logger.info('Application démarrée');
    } catch (e) {
      logger.error('Échec d’initialisation de la base locale', { error: String(e) });
      setReady(true);
    }

    runSync();
    registerBackgroundSync();
    const unsubscribe = subscribeOnReconnect(() => {
      logger.info('Connexion Internet rétablie — reprise des envois');
      runSync();
    });
    return unsubscribe;
  }, []);

  if (!ready) return null;

  return (
    <>
      {/* Dark status-bar icons: every screen (header included) is now light. */}
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}
