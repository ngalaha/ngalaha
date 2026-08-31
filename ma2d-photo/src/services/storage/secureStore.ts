import * as SecureStore from 'expo-secure-store';

/**
 * Wraps expo-secure-store (iOS Keychain / Android Keystore).
 *
 * Only OAuth tokens for the signed-in Microsoft account are stored here.
 * Never store a password, client secret, or any permanent credential —
 * see spec section 34 (Sécurité).
 */

const TOKEN_CACHE_KEY = 'ma2d.msal.tokenCache.v1';

export async function saveTokenCache(serializedCache: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_CACHE_KEY, serializedCache, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function loadTokenCache(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_CACHE_KEY);
}

export async function clearTokenCache(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_CACHE_KEY);
}
