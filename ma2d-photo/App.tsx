import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from '@/database/db';
import { ensureSeeded } from '@/database/projectsRepository';
import { I18nProvider } from '@/i18n/I18nContext';
import RootNavigator from '@/navigation/RootNavigator';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
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
    <I18nProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </I18nProvider>
  );
}

/** Inside the provider, so the status bar can follow the chosen theme. */
function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}
