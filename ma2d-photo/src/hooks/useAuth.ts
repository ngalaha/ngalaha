import { useCallback, useEffect, useState } from 'react';

import {
  getCurrentAccount,
  signIn as msSignIn,
  signOut as msSignOut,
} from '@/services/microsoftGraph/authService';
import { getStoredAccount, subscribeAccount } from '@/services/microsoftGraph/authStore';
import { logger } from '@/services/logging/logger';
import { AppError } from '@/utils/errorMessages';
import { MicrosoftAccount } from '@/types';

/**
 * Reads the shared session (see authStore) rather than keeping a private
 * copy, so the navigator, the login screen and the home screen always
 * agree on who is signed in — signing in or out switches screens right
 * away instead of only after the app is restarted.
 */

/** Restores the stored session once per app run, however many screens ask. */
let restorePromise: Promise<MicrosoftAccount | null> | null = null;
let restored = false;

function restoreOnce(): Promise<MicrosoftAccount | null> {
  if (!restorePromise) {
    restorePromise = getCurrentAccount().finally(() => {
      restored = true;
    });
  }
  return restorePromise;
}

export function useAuth() {
  const [account, setAccount] = useState<MicrosoftAccount | null>(getStoredAccount);
  const [loading, setLoading] = useState(!restored);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAccount(setAccount);
    let cancelled = false;
    restoreOnce()
      .then(() => {
        // Read the store rather than this promise's value: it resolved once,
        // at app start, and a screen mounting after a sign-in would otherwise
        // apply that stale "nobody is signed in" result.
        if (!cancelled) setAccount(getStoredAccount());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // The account lands in the shared store, which updates every screen —
      // no local setState needed here.
      await msSignIn();
    } catch (e) {
      const message = e instanceof AppError ? e.userMessage : 'Connexion impossible.';
      logger.error('Échec de connexion Microsoft', { error: String(e) });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await msSignOut();
  }, []);

  return { account, isSignedIn: !!account, loading, error, signIn, signOut };
}
