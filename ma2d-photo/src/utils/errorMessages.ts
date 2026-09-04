/**
 * Centralized French, user-facing error messages (spec section 16).
 * Keep technical detail out of these — put it in the logger instead.
 */
export const USER_MESSAGES = {
  NO_INTERNET:
    'Connexion Internet indisponible. La photo a été sauvegardée et sera envoyée automatiquement.',
  UPLOAD_SUCCESS: '✅ Photo enregistrée dans OneDrive.',
  ONEDRIVE_ACCESS_ERROR: "⚠️ Impossible d'accéder au dossier OneDrive.",
  AUTHORIZATION_PENDING:
    "🔒 Autorisation en attente : demandez à un administrateur MA2D d'approuver l'application dans Microsoft Entra ID (Administration > Diagnostic pour les détails). La photo reste en file d'attente et sera envoyée automatiquement dès que l'accès sera approuvé.",
  SESSION_EXPIRED: '🔐 Votre session Microsoft doit être renouvelée.',
  FOLDER_NOT_FOUND: '⚠️ Le dossier Photo du bâtiment est introuvable.',
  FOLDER_NOT_CONFIGURED: "⚠️ Ce bâtiment n'a pas encore de dossier OneDrive configuré.",
  GENERIC_UPLOAD_FAILURE: "⚠️ Échec de l'envoi. La photo restera en file d'attente.",
  INVALID_SHARE_LINK: "⚠️ Ce lien OneDrive n'est pas valide ou n'est pas accessible avec ce compte.",
} as const;

export class AppError extends Error {
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
