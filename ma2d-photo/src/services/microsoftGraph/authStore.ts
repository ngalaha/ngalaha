import { MicrosoftAccount } from '@/types';

/**
 * The signed-in account, shared by every screen.
 *
 * useAuth() used to hold this in its own useState, so each caller had its
 * own copy: the navigator decided which screen to show from one instance
 * while the Login and Home screens signed in and out through others. The
 * navigator therefore never learned that the account had changed, and the
 * app only picked it up when it was closed and reopened.
 *
 * Keeping the account in one module-level value with subscribers — the
 * same pattern as the upload queue — makes signing in and out take effect
 * immediately, everywhere. authService publishes here whenever it stores
 * or drops a session, including when a silent refresh fails, so a session
 * that expires in the background sends the app back to the login screen
 * instead of leaving it looking connected while every upload fails.
 */

export type AuthListener = (account: MicrosoftAccount | null) => void;

let currentAccount: MicrosoftAccount | null = null;
const listeners = new Set<AuthListener>();

export function getStoredAccount(): MicrosoftAccount | null {
  return currentAccount;
}

export function publishAccount(account: MicrosoftAccount | null): void {
  currentAccount = account;
  listeners.forEach((listener) => listener(account));
}

export function subscribeAccount(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
