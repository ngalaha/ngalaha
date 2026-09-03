import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * A lightweight admin PIN gate for destructive/creative admin actions
 * (create or delete a project, building or apartment) — a deterrent
 * against anyone who picks up the phone doing this by accident or on a
 * whim, not a security boundary against a determined attacker. Only the
 * SHA-256 hash is stored (in SecureStore, alongside the Microsoft tokens),
 * never the PIN itself.
 */

const PIN_HASH_KEY = 'ma2d.adminPinHash';
const SECURE_STORE_OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED };

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function hasAdminPin(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return !!hash;
}

export async function setAdminPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash, SECURE_STORE_OPTIONS);
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!hash) return false;
  return (await hashPin(pin)) === hash;
}

export async function clearAdminPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_HASH_KEY);
}
