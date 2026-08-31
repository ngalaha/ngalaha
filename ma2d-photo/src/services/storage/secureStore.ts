import * as SecureStore from 'expo-secure-store';

/**
 * Wraps expo-secure-store (iOS Keychain / Android Keystore).
 *
 * Only OAuth tokens for the signed-in Microsoft account are stored here.
 * Never store a password, client secret, or any permanent credential —
 * see spec section 34 (Sécurité).
 *
 * expo-secure-store caps each stored value at 2048 bytes (Android). A
 * Microsoft Graph access token + refresh token combined routinely exceed
 * that on their own, so a single JSON blob would silently fail to persist
 * (breaking session restore after the app is closed). Each token is
 * therefore stored under its own key instead of one combined blob.
 */

const ACCESS_TOKEN_KEY = 'ma2d.msal.accessToken.v1';
const REFRESH_TOKEN_KEY = 'ma2d.msal.refreshToken.v1';
const META_KEY = 'ma2d.msal.meta.v1'; // small JSON: { expiresAt, account }

const SECURE_STORE_OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED };

export interface StoredTokenMeta {
  expiresAt: number;
  account: { homeAccountId: string; username: string; name: string | null };
}

export interface StoredTokenSet extends StoredTokenMeta {
  accessToken: string;
  refreshToken: string | null;
}

export async function saveTokenCache(tokenSet: StoredTokenSet): Promise<void> {
  const meta: StoredTokenMeta = { expiresAt: tokenSet.expiresAt, account: tokenSet.account };
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokenSet.accessToken, SECURE_STORE_OPTIONS),
    tokenSet.refreshToken
      ? SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokenSet.refreshToken, SECURE_STORE_OPTIONS)
      : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.setItemAsync(META_KEY, JSON.stringify(meta), SECURE_STORE_OPTIONS),
  ]);
}

export async function loadTokenCache(): Promise<StoredTokenSet | null> {
  const [accessToken, refreshToken, metaRaw] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(META_KEY),
  ]);
  if (!accessToken || !metaRaw) return null;
  try {
    const meta = JSON.parse(metaRaw) as StoredTokenMeta;
    return { accessToken, refreshToken: refreshToken ?? null, ...meta };
  } catch {
    return null;
  }
}

export async function clearTokenCache(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(META_KEY),
  ]);
}
