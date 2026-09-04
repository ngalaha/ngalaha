import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { ENV, isMicrosoftAuthConfigured } from '@/config/env';
import { AppError, USER_MESSAGES } from '@/utils/errorMessages';
import { logger } from '@/services/logging/logger';
import { clearAdminSession } from '@/services/security/adminPin';
import { clearTokenCache, loadTokenCache, saveTokenCache } from '@/services/storage/secureStore';
import { base64Decode, utf8DecodeBytes } from '@/utils/base64';
import { MicrosoftAccount } from '@/types';

import { FILE_SCOPES, SIGN_IN_SCOPES, discovery, getRedirectUri } from './authConfig';
import { publishAccount } from './authStore';

WebBrowser.maybeCompleteAuthSession();

interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // epoch ms
  account: MicrosoftAccount;
}

let cachedTokenSet: TokenSet | null = null;
/** Kept in memory only — it is derived from the stored refresh token. */
let filesToken: { accessToken: string; expiresAt: number } | null = null;
const REFRESH_SAFETY_MARGIN_MS = 5 * 60 * 1000;

function decodeIdTokenClaims(idToken: string): { username: string; name: string | null; oid: string } {
  try {
    const payload = idToken.split('.')[1];
    // JWT segments are base64url — normalize to standard base64 before
    // decoding. Deliberately avoids `atob`: Hermes (RN's JS engine) does
    // not guarantee it exists, so we decode via our own byte-level helpers.
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = utf8DecodeBytes(base64Decode(normalized));
    const claims = JSON.parse(json);
    return {
      username: claims.preferred_username ?? claims.email ?? 'utilisateur',
      name: claims.name ?? null,
      oid: claims.oid ?? claims.sub ?? 'unknown',
    };
  } catch (e) {
    logger.warn('Impossible de décoder le id_token', { error: String(e) });
    return { username: 'utilisateur', name: null, oid: 'unknown' };
  }
}

async function persist(tokenSet: TokenSet): Promise<void> {
  cachedTokenSet = tokenSet;
  await saveTokenCache(tokenSet);
  publishAccount(tokenSet.account);
}

/** Drops the session everywhere: memory, secure store, and every screen. */
async function forgetSession(): Promise<void> {
  cachedTokenSet = null;
  filesToken = null;
  await clearTokenCache();
  publishAccount(null);
}

async function restore(): Promise<TokenSet | null> {
  if (cachedTokenSet) return cachedTokenSet;
  const stored = await loadTokenCache();
  if (!stored) return null;
  cachedTokenSet = stored;
  publishAccount(stored.account);
  return cachedTokenSet;
}

/**
 * Launches the Microsoft sign-in flow (Authorization Code + PKCE) in the
 * system browser / ASWebAuthenticationSession. No client secret is used —
 * this is a public client, as required for a mobile app (spec section 8).
 */
export async function signIn(): Promise<MicrosoftAccount> {
  if (!isMicrosoftAuthConfigured()) {
    throw new AppError(
      "Configuration Microsoft manquante (Client ID). Voir docs/ENTRA_ID_SETUP.md.",
      'MICROSOFT_CLIENT_ID not set'
    );
  }

  const redirectUri = getRedirectUri();
  const request = new AuthSession.AuthRequest({
    clientId: ENV.MICROSOFT_CLIENT_ID,
    scopes: SIGN_IN_SCOPES,
    redirectUri,
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
  });

  logger.info('Démarrage de la connexion Microsoft', { redirectUri });
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.code) {
    logger.warn('Connexion Microsoft annulée ou refusée', { type: result.type });
    throw new AppError('Connexion Microsoft annulée.', `AuthSession result: ${result.type}`);
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: ENV.MICROSOFT_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      scopes: SIGN_IN_SCOPES,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    },
    discovery
  );

  const claims = decodeIdTokenClaims(tokenResponse.idToken ?? '');
  const account: MicrosoftAccount = {
    homeAccountId: claims.oid,
    username: claims.username,
    name: claims.name,
  };

  const expiresAt = Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000;
  await persist({
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken ?? null,
    expiresAt,
    account,
  });

  logger.info('Connexion Microsoft réussie', { username: account.username });
  return account;
}

/** Returns a valid access token, refreshing silently if needed. Throws AppError if re-login is required. */
export async function getAccessToken(): Promise<string> {
  const tokenSet = await restore();
  if (!tokenSet) {
    throw new AppError(USER_MESSAGES.SESSION_EXPIRED, 'No token cache');
  }

  if (Date.now() < tokenSet.expiresAt - REFRESH_SAFETY_MARGIN_MS) {
    return tokenSet.accessToken;
  }

  if (!tokenSet.refreshToken) {
    await forgetSession();
    throw new AppError(USER_MESSAGES.SESSION_EXPIRED, 'No refresh token available');
  }

  try {
    logger.info('Renouvellement du jeton Microsoft (silencieux)');
    const refreshed = await AuthSession.refreshAsync(
      {
        clientId: ENV.MICROSOFT_CLIENT_ID,
        refreshToken: tokenSet.refreshToken,
        scopes: SIGN_IN_SCOPES,
      },
      discovery
    );
    const expiresAt = Date.now() + (refreshed.expiresIn ?? 3600) * 1000;
    await persist({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? tokenSet.refreshToken,
      expiresAt,
      account: tokenSet.account,
    });
    return refreshed.accessToken;
  } catch (e) {
    logger.error('Échec du renouvellement du jeton Microsoft', { error: String(e) });
    await forgetSession();
    throw new AppError(USER_MESSAGES.SESSION_EXPIRED, 'Refresh failed', e);
  }
}


/**
 * An access token that may touch OneDrive files.
 *
 * Sign-in only asks for identity (see authConfig), so this exchanges the
 * refresh token for the file scopes as well. Microsoft grants that silently
 * once — and only once — an administrator has consented; until then it
 * refuses, which is reported as "autorisation en attente" rather than as a
 * broken session. Nothing here signs the user out: the account is fine, it
 * is the authorization that is missing.
 */
export async function getFilesAccessToken(): Promise<string> {
  if (filesToken && Date.now() < filesToken.expiresAt - REFRESH_SAFETY_MARGIN_MS) {
    return filesToken.accessToken;
  }

  const tokenSet = await restore();
  if (!tokenSet) throw new AppError(USER_MESSAGES.SESSION_EXPIRED, 'No token cache');
  if (!tokenSet.refreshToken) {
    await forgetSession();
    throw new AppError(USER_MESSAGES.SESSION_EXPIRED, 'No refresh token available');
  }

  try {
    const upgraded = await AuthSession.refreshAsync(
      {
        clientId: ENV.MICROSOFT_CLIENT_ID,
        refreshToken: tokenSet.refreshToken,
        scopes: FILE_SCOPES,
      },
      discovery
    );
    filesToken = {
      accessToken: upgraded.accessToken,
      expiresAt: Date.now() + (upgraded.expiresIn ?? 3600) * 1000,
    };
    // A refreshed refresh token must replace the stored one, or the next
    // silent call would present a token Microsoft has already rotated out.
    if (upgraded.refreshToken && upgraded.refreshToken !== tokenSet.refreshToken) {
      await persist({ ...tokenSet, refreshToken: upgraded.refreshToken });
    }
    return filesToken.accessToken;
  } catch (e) {
    filesToken = null;
    // A refusal here has two very different causes. Ask for the sign-in
    // scopes alone to tell them apart: if that works, the session is healthy
    // and it is the file authorization that is missing; if it fails too, the
    // session itself is gone and getAccessToken has already cleared it and
    // thrown SESSION_EXPIRED — which sends the user back to the login screen
    // instead of leaving them staring at a consent message forever.
    await getAccessToken();
    logger.warn('Accès aux fichiers OneDrive refusé — consentement administrateur en attente', {
      error: String(e),
    });
    throw new AppError(USER_MESSAGES.AUTHORIZATION_PENDING, 'Files scope not consented', e);
  }
}

export async function getCurrentAccount(): Promise<MicrosoftAccount | null> {
  const tokenSet = await restore();
  return tokenSet?.account ?? null;
}

export async function isSignedIn(): Promise<boolean> {
  return (await restore()) !== null;
}

export async function signOut(): Promise<void> {
  await forgetSession();
  // A new person signing in must not inherit the previous one's unlocked
  // administration window.
  clearAdminSession();
  logger.info('Déconnexion Microsoft effectuée');
}
