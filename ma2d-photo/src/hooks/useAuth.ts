import { useCallback, useEffect, useState } from 'react';

import {
  getCurrentAccount,
  signIn as msSignIn,
  signOut as msSignOut,
} from '@/services/microsoftGraph/authService';
import { logger } from '@/services/logging/logger';
import { AppError } from '@/utils/errorMessages';
import { MicrosoftAccount } from '@/types';

export function useAuth() {
  const [account, setAccount] = useState<MicrosoftAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentAccount()
      .then(setAccount)
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const acc = await msSignIn();
      setAccount(acc);
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
    setAccount(null);
  }, []);

  return { account, isSignedIn: !!account, loading, error, signIn, signOut };
}
