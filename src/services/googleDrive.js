// Minimal Google Drive v3 REST client covering exactly what the app needs:
// find-or-create a subfolder, and resumable file upload with progress events.

import { requestAccessToken } from './googleAuth'

const API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files'

class DriveError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message)
    this.name = 'DriveError'
    this.status = status
    this.cause = cause
  }
}

function escapeForQuery(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** Accepts either a raw Drive folder ID or a full Drive folder URL. */
export function extractFolderId(input) {
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (urlMatch) return urlMatch[1]
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idParamMatch) return idParamMatch[1]
  // Assume it's already a bare folder ID.
  return trimmed.replace(/[?#].*$/, '')
}

async function authorizedFetch(url, options = {}, { interactive = true } = {}) {
  const token = await requestAccessToken({ interactive })
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
    throw new DriveError(
      detail || `Erreur Google Drive (HTTP ${res.status})`,
      { status: res.status },
    )
  }
  return res
}

/** Verifies a folder ID exists and is reachable with the current account. */
export async function verifyFolder(folderId, { interactive = true } = {}) {
  const url = `${API_BASE}/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType&supportsAllDrives=true`
  const res = await authorizedFetch(url, {}, { interactive })
  const data = await res.json()
  if (data.mimeType !== 'application/vnd.google-apps.folder') {
    throw new DriveError("L'identifiant fourni ne correspond pas à un dossier Google Drive.")
  }
  return data
}

async function findChildFolder(name, parentId, { interactive }) {
  const q = [
    `'${escapeForQuery(parentId)}' in parents`,
    `name = '${escapeForQuery(name)}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    'trashed = false',
  ].join(' and ')
  const url = `${API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true`
  const res = await authorizedFetch(url, {}, { interactive })
  const data = await res.json()
  return data.files?.[0] ?? null
}

async function createChildFolder(name, parentId, { interactive }) {
  const url = `${API_BASE}/files?fields=id,name&supportsAllDrives=true`
  const res = await authorizedFetch(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    },
    { interactive },
  )
  return res.json()
}

/** Finds a subfolder by name under `parentId`, creating it if missing. */
export async function getOrCreateFolder(name, parentId, { interactive = true } = {}) {
  const existing = await findChildFolder(name, parentId, { interactive })
  if (existing) return existing
  return createChildFolder(name, parentId, { interactive })
}

/**
 * Ensures Photo/<YYYY-MM-DD>/ exists under the building's Drive folder,
 * returning that dated folder's ID.
 */
export async function getOrCreateDailyPhotoFolder(buildingFolderId, dateStr, opts = {}) {
  const photoFolder = await getOrCreateFolder('Photo', buildingFolderId, opts)
  const dailyFolder = await getOrCreateFolder(dateStr, photoFolder.id, opts)
  return dailyFolder.id
}

/**
 * Uploads a file into `folderId` using the resumable upload protocol,
 * reporting progress via `onProgress(fraction)`.
 */
export async function uploadFile(blob, filename, folderId, { onProgress, interactive = true, signal } = {}) {
  const token = await requestAccessToken({ interactive })

  const initRes = await fetch(`${UPLOAD_BASE}?uploadType=resumable&fields=id,name,webViewLink`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': blob.type || 'image/jpeg',
    },
    body: JSON.stringify({ name: filename, parents: [folderId] }),
  })
  if (!initRes.ok) {
    throw new DriveError(`Impossible de démarrer l'envoi (HTTP ${initRes.status})`, { status: initRes.status })
  }
  const uploadUrl = initRes.headers.get('Location')
  if (!uploadUrl) throw new DriveError("Session d'envoi Google Drive invalide.")

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', blob.type || 'image/jpeg')

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort())
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total)
      }
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
        reject(new DriveError(`Échec de l'envoi vers Google Drive (HTTP ${xhr.status})`, { status: xhr.status }))
      }
    }
    xhr.onerror = () => reject(new DriveError('Erreur réseau pendant l\'envoi vers Google Drive.'))
    xhr.onabort = () => reject(new DriveError('Envoi annulé.'))
    xhr.send(blob)
  })
}

export { DriveError }
