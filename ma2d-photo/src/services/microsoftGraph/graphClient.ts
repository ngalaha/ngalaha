import { AppError, USER_MESSAGES } from '@/utils/errorMessages';
import { logger } from '@/services/logging/logger';

import { GRAPH_BASE_URL } from './authConfig';
import { getAccessToken, signOut } from './authService';

interface GraphRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string; // e.g. "/me" or full URL
  body?: unknown;
  rawBody?: ArrayBuffer | Uint8Array;
  extraHeaders?: Record<string, string>;
}

/** Thin, explicit wrapper around Microsoft Graph REST calls (v1.0). */
export async function graphRequest<T>(options: GraphRequestOptions): Promise<T> {
  const accessToken = await getAccessToken();
  const url = options.path.startsWith('http') ? options.path : `${GRAPH_BASE_URL}${options.path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    ...options.extraHeaders,
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.rawBody ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });

  if (response.status === 401) {
    logger.warn('Graph a renvoyé 401 — session Microsoft expirée', { url });
    await signOut();
    throw new AppError(USER_MESSAGES.SESSION_EXPIRED, `401 on ${url}`);
  }

  if (response.status === 404) {
    logger.warn('Graph 404', { url });
    throw new AppError(USER_MESSAGES.FOLDER_NOT_FOUND, `404 on ${url}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    logger.error('Erreur Graph API', { url, status: response.status, body: text });
    throw new AppError(USER_MESSAGES.ONEDRIVE_ACCESS_ERROR, `Graph ${response.status}: ${text}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
