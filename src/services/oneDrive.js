// Minimal Microsoft Graph client covering exactly what the app needs:
// resolve a OneDrive sharing link to a driveItem, find-or-create a dated
// subfolder, and upload a file with progress events.

import { getAccessToken } from './msAuth'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

class OneDriveError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message)
    this.name = 'OneDriveError'
    this.status = status
    this.cause = cause
  }
}

/**
 * Encodes a sharing URL into the Microsoft Graph "shares" API token format.
 * https://learn.microsoft.com/en-us/graph/api/shares-get
 */
function encodeSharingUrl(url) {
  const base64 = btoa(unescape(encodeURIComponent(url.trim())))
  const base64Url = base64.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-')
  return `u!${base64Url}`
}

async function authorizedFetch(url, options = {}, { interactive = true } = {}) {
  const token = await getAccessToken({ interactive })
  if (!token) throw new OneDriveError('Connexion Microsoft requise.', { status: 401 })

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.error?.message || ''
    } catch {
      // ignore body parse failure
    }
    throw new OneDriveError(detail || `Erreur OneDrive (HTTP ${res.status})`, { status: res.status })
  }
  return res
}

/**
 * Resolves a OneDrive/SharePoint sharing link (folder) to { driveId, itemId, name }.
 * Works for both personal OneDrive and OneDrive for Business / SharePoint links.
 */
export async function resolveShareLink(url, { interactive = true } = {}) {
  const shareId = encodeSharingUrl(url)
  const apiUrl = `${GRAPH_BASE}/shares/${shareId}/driveItem?$select=id,name,folder,parentReference`
  const res = await authorizedFetch(apiUrl, {}, { interactive })
  const data = await res.json()
  if (!data.folder) {
    throw new OneDriveError("Ce lien ne pointe pas vers un dossier OneDrive.")
  }
  const driveId = data.parentReference?.driveId
  if (!driveId) throw new OneDriveError("Impossible de déterminer le lecteur OneDrive pour ce lien.")
  return { driveId, itemId: data.id, name: data.name }
}

async function getChildByPath(driveId, parentId, name, { interactive }) {
  const url = `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(parentId)}:/${encodeURIComponent(name)}`
  const token = await getAccessToken({ interactive })
  if (!token) throw new OneDriveError('Connexion Microsoft requise.', { status: 401 })
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 404) return null
  if (!res.ok) throw new OneDriveError(`Erreur OneDrive (HTTP ${res.status})`, { status: res.status })
  return res.json()
}

async function createChildFolder(driveId, parentId, name, { interactive }) {
  const url = `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(parentId)}/children`
  try {
    const res = await authorizedFetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' }),
      },
      { interactive },
    )
    return res.json()
  } catch (err) {
    // Another device created the same dated folder in the meantime — just fetch it.
    if (err.status === 409) {
      const existing = await getChildByPath(driveId, parentId, name, { interactive })
      if (existing) return existing
    }
    throw err
  }
}

/** Ensures a YYYY-MM-DD subfolder exists directly under the building's Photo folder. */
export async function getOrCreateDateFolder(driveId, photoFolderId, dateStr, opts = {}) {
  const existing = await getChildByPath(driveId, photoFolderId, dateStr, opts)
  if (existing) return existing.id
  const created = await createChildFolder(driveId, photoFolderId, dateStr, opts)
  return created.id
}

/**
 * Uploads a file into a folder using a Graph upload session, reporting
 * progress via `onProgress(fraction)`. Works for files of any size.
 */
export async function uploadFile(blob, filename, driveId, folderId, { onProgress, interactive = true, signal } = {}) {
  const sessionUrl = `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}:/${encodeURIComponent(filename)}:/createUploadSession`
  const sessionRes = await authorizedFetch(
    sessionUrl,
    {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'rename' } }),
    },
    { interactive },
  )
  const { uploadUrl } = await sessionRes.json()
  if (!uploadUrl) throw new OneDriveError("Session d'envoi OneDrive invalide.")

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    // No Authorization header here: the upload session URL is pre-authenticated.
    xhr.setRequestHeader('Content-Range', `bytes 0-${blob.size - 1}/${blob.size}`)
    xhr.setRequestHeader('Content-Type', blob.type || 'image/jpeg')

    if (signal) signal.addEventListener('abort', () => xhr.abort())

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1)
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve({})
        }
      } else {
        reject(new OneDriveError(`Échec de l'envoi vers OneDrive (HTTP ${xhr.status})`, { status: xhr.status }))
      }
    }
    xhr.onerror = () => reject(new OneDriveError("Erreur réseau pendant l'envoi vers OneDrive."))
    xhr.onabort = () => reject(new OneDriveError('Envoi annulé.'))
    xhr.send(blob)
  })
}

export { OneDriveError }
