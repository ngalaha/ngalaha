// Microsoft identity platform (MSAL) wrapper for OneDrive / Microsoft Graph access.
// Uses the SPA "popup" flow (Authorization Code + PKCE, handled internally by MSAL) —
// the supported approach for a pure client-side app with no backend.
//
// Docs: https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-overview

import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'

const CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID
// "common" accepts both personal Microsoft accounts and work/school (Entra ID) accounts,
// as long as the Azure app registration allows "any organizational directory + personal accounts".
const TENANT = import.meta.env.VITE_MS_TENANT_ID || 'common'
const SCOPES = ['User.Read', 'Files.ReadWrite']

let msalInstance = null
let initPromise = null

function ensureConfigured() {
  if (!CLIENT_ID) {
    throw new Error(
      "VITE_MS_CLIENT_ID manquant. Configurez votre identifiant d'application Microsoft Entra dans le fichier .env (voir README).",
    )
  }
}

async function getInstance() {
  ensureConfigured()
  if (!msalInstance) {
    msalInstance = new PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT}`,
        redirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: 'localStorage',
      },
    })
  }
  if (!initPromise) {
    initPromise = msalInstance.initialize()
  }
  await initPromise
  return msalInstance
}

function activeAccount(instance) {
  return instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null
}

export function isConfigured() {
  return Boolean(CLIENT_ID)
}

export async function getStoredAccount() {
  const instance = await getInstance()
  const account = activeAccount(instance)
  return account
    ? { name: account.name, username: account.username, initial: (account.name || account.username || '?')[0] }
    : null
}

/** Signs the user in interactively via a popup. */
export async function signIn() {
  const instance = await getInstance()
  const result = await instance.loginPopup({ scopes: SCOPES, prompt: 'select_account' })
  instance.setActiveAccount(result.account)
  return {
    name: result.account.name,
    username: result.account.username,
    initial: (result.account.name || result.account.username || '?')[0],
  }
}

export async function signOut() {
  const instance = await getInstance()
  const account = activeAccount(instance)
  if (account) {
    await instance.logoutPopup({ account }).catch(() => {
      // Popup logout can be blocked/cancelled — clearing the local cache is enough for our needs.
      instance.setActiveAccount(null)
    })
  }
}

/**
 * Returns a valid Graph access token, silently refreshing when possible.
 * @param {{interactive?: boolean}} opts - interactive=true allows a popup prompt
 *   when silent refresh fails (must be called from a user gesture).
 */
export async function getAccessToken({ interactive = true } = {}) {
  const instance = await getInstance()
  let account = activeAccount(instance)

  if (!account) {
    if (!interactive) return null
    await signIn()
    account = activeAccount(instance)
  }

  try {
    const result = await instance.acquireTokenSilent({ scopes: SCOPES, account })
    return result.accessToken
  } catch (err) {
    if (!interactive) {
      if (err instanceof InteractionRequiredAuthError) return null
      throw err
    }
    const result = await instance.acquireTokenPopup({ scopes: SCOPES, account })
    return result.accessToken
  }
}
