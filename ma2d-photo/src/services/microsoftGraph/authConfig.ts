import * as AuthSession from 'expo-auth-session';

import { ENV } from '@/config/env';

/**
 * Microsoft identity platform (Entra ID) configuration for a mobile
 * PUBLIC CLIENT using Authorization Code + PKCE — no client secret,
 * ever (see spec section 8/34 and docs/ENTRA_ID_SETUP.md).
 */

/**
 * Scopes are asked for in two steps, on purpose.
 *
 * SIGN_IN_SCOPES is what signing in requests: identity only. MA2D's tenant
 * requires an administrator to approve access to files, and asking for that
 * up front turns the sign-in screen itself into "Approbation administrateur
 * requise" — the app becomes unusable, not just unable to upload. Keeping
 * sign-in to identity means everyone can use the app, take photos and queue
 * them while the authorization is being arranged.
 *
 * FILE_SCOPES is requested silently, later, the first time the app actually
 * touches OneDrive (see getFilesAccessToken). Before consent is granted that
 * request fails and the queue reports "autorisation en attente"; the moment
 * an administrator grants it, the same silent request succeeds and the
 * backlog uploads on its own, with nobody signing in again.
 *
 * Files.ReadWrite.All rather than Files.ReadWrite: building folders are
 * reached through a share link resolved with GET /shares/{id}/driveItem
 * (oneDriveService.ts), and Graph only grants that endpoint to the .All
 * variant. Every scope here is delegated — the app never acts on its own
 * behalf, and never reaches beyond what the signed-in employee can already
 * open in OneDrive themselves.
 */
export const SIGN_IN_SCOPES = ['openid', 'profile', 'offline_access', 'User.Read'];

export const FILE_SCOPES = [...SIGN_IN_SCOPES, 'Files.ReadWrite.All'];

export function getAuthority(): string {
  return `https://login.microsoftonline.com/${ENV.MICROSOFT_TENANT_ID}/v2.0`;
}

export const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://login.microsoftonline.com/${ENV.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${ENV.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
  revocationEndpoint: `https://login.microsoftonline.com/${ENV.MICROSOFT_TENANT_ID}/oauth2/v2.0/logout`,
};

/**
 * Redirect URI registered in Entra ID as a "Mobile and desktop
 * applications" platform entry: ma2dphoto://auth
 *
 * This resolves correctly to `ma2dphoto://auth` in a development build or
 * any EAS/standalone build (verified against expo-linking's createURL).
 * In Expo Go it instead resolves to an unstable `exp://<host>:<port>/--/auth`
 * loopback URL that cannot be pre-registered in Entra ID — Microsoft
 * sign-in therefore does NOT work inside Expo Go. Use a development build
 * (`npx expo run:android` / `eas build --profile development`) or a real
 * build to test authentication — see docs/ENTRA_ID_SETUP.md.
 */
export function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: ENV.REDIRECT_SCHEME, path: 'auth' });
}

export const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
