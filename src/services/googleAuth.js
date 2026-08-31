// Thin wrapper around Google Identity Services (GIS) token client.
// Uses the OAuth2 implicit "token client" flow, which is the supported
// approach for pure client-side (no backend) apps like this PWA.
//
// Docs: https://developers.google.com/identity/oauth2/web/guides/use-token-model

const SCOPE = 'https://www.googleapis.com/auth/drive'
const STORAGE_KEY = 'ma2d.googleToken'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

let tokenClient = null
let gisLoadPromise = null

function loadGisScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-gis]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.gis = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Impossible de charger Google Identity Services."))
    document.head.appendChild(script)
  })
  return gisLoadPromise
}

function readStoredToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.accessToken || !parsed?.expiresAt) return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredToken(token) {
  if (!token) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
}

export function isConfigured() {
  return Boolean(CLIENT_ID)
}

export function getStoredAccessToken() {
  const stored = readStoredToken()
  if (!stored) return null
  // Refresh 60s before actual expiry to stay safe.
  if (Date.now() > stored.expiresAt - 60_000) return null
  return stored.accessToken
}

export function getStoredAccount() {
  return readStoredToken()?.account ?? null
}

export function signOut() {
  const stored = readStoredToken()
  if (stored?.accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(stored.accessToken, () => {})
  }
  writeStoredToken(null)
}

async function ensureTokenClient() {
  await loadGisScript()
  if (!CLIENT_ID) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID manquant. Configurez votre identifiant client OAuth Google dans le fichier .env (voir README).",
    )
  }
  if (tokenClient) return tokenClient

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: () => {}, // overridden per-request below
  })
  return tokenClient
}

/**
 * Requests a Drive access token, reusing a cached one when still valid.
 * @param {{interactive?: boolean}} opts - interactive=true shows the Google
 *   consent popup (must be called from a user gesture); interactive=false
 *   attempts a silent, prompt-less refresh.
 */
export async function requestAccessToken({ interactive = true } = {}) {
  const cached = getStoredAccessToken()
  if (cached) return cached

  const client = await ensureTokenClient()

  return new Promise((resolve, reject) => {
    client.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error_description || response.error))
        return
      }
      const expiresAt = Date.now() + Number(response.expires_in ?? 3600) * 1000
      writeStoredToken({ accessToken: response.access_token, expiresAt })
      resolve(response.access_token)
    }
    client.error_callback = (err) => {
      reject(new Error(err?.message || "Connexion Google refusée ou annulée."))
    }
    client.requestAccessToken({ prompt: interactive ? 'consent' : '' })
  })
}
