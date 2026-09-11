import { TranslationKey, translate } from '@/i18n/translate';

/**
 * Translation keys for the errors a user actually sees (spec section 16).
 * Keep technical detail out of these — put it in the logger instead.
 *
 * These are keys rather than sentences because several of them are stored:
 * a failed upload keeps its lastError in the database and shows it days
 * later. Storing the key means the message follows whatever language the
 * phone is set to at the moment it is read, not the one in use when it
 * failed. It also makes the identity comparisons in oneDriveService compare
 * something stable.
 */
export const USER_MESSAGES = {
  NO_INTERNET: 'error.noInternet',
  UPLOAD_SUCCESS: 'error.uploadSuccess',
  ONEDRIVE_ACCESS_ERROR: 'error.oneDriveAccess',
  AUTHORIZATION_PENDING: 'error.authorizationPending',
  SESSION_EXPIRED: 'error.sessionExpired',
  FOLDER_NOT_FOUND: 'error.folderNotFound',
  FOLDER_NOT_CONFIGURED: 'error.folderNotConfigured',
  GENERIC_UPLOAD_FAILURE: 'error.genericUploadFailure',
  INVALID_SHARE_LINK: 'error.invalidShareLink',
} as const satisfies Record<string, TranslationKey>;

/**
 * Turns a stored message into something to show. Rows written by an earlier
 * version hold a French sentence rather than a key; translate() falls back to
 * what it was given, so those keep reading exactly as they did.
 */
export function userMessage(stored: string): string {
  return translate(stored as TranslationKey);
}

export class AppError extends Error {
  /** A key from USER_MESSAGES — translate it with userMessage() to show it. */
  readonly userMessage: string;
  readonly cause?: unknown;
  /** HTTP status when the error came from a Graph response, for callers
   *  that must tell "not found" or "changed under us" from a real failure. */
  readonly status?: number;

  constructor(userMessage: string, technicalMessage?: string, cause?: unknown, status?: number) {
    super(technicalMessage ?? userMessage);
    this.userMessage = userMessage;
    this.cause = cause;
    this.status = status;
  }
}
