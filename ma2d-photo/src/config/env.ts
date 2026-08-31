import Constants from 'expo-constants';

/**
 * Central place reading configuration from app.json `extra` (and, in a
 * bare/dev workflow, from process.env). Nothing secret lives here: only
 * the public Client ID, tenant, and redirect scheme are needed for the
 * PKCE mobile auth flow — see docs/ENTRA_ID_SETUP.md.
 */

interface AppExtra {
  microsoftClientId?: string;
  microsoftTenantId?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const ENV = {
  MICROSOFT_CLIENT_ID: extra.microsoftClientId ?? 'À_RENSEIGNER',
  MICROSOFT_TENANT_ID: extra.microsoftTenantId ?? 'common',
  REDIRECT_SCHEME: 'ma2dphoto',
};

export function isMicrosoftAuthConfigured(): boolean {
  return (
    !!ENV.MICROSOFT_CLIENT_ID &&
    ENV.MICROSOFT_CLIENT_ID !== 'À_RENSEIGNER' &&
    ENV.MICROSOFT_CLIENT_ID.length > 10
  );
}
