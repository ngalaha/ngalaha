import * as AuthSession from 'expo-auth-session';

import { ENV } from '@/config/env';

/**
 * Microsoft identity platform (Entra ID) configuration for a mobile
 * PUBLIC CLIENT using Authorization Code + PKCE — no client secret,
 * ever (see spec section 8/34 and docs/ENTRA_ID_SETUP.md).
 */

export const GRAPH_SCOPES = ['openid', 'profile', 'offline_access', 'User.Read', 'Files.ReadWrite'];

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
