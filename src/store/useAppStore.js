import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  requestAccessToken,
  getStoredAccessToken,
  getStoredAccount,
  signOut as googleSignOut,
  isConfigured,
} from '../services/googleAuth'
import { extractFolderId, verifyFolder, getOrCreateDailyPhotoFolder, uploadFile } from '../services/googleDrive'
import { addQueueItem, updateQueueItem, listQueueItems, removeQueueItem } from '../services/uploadQueue'
import { formatDateFolder } from '../utils/filename'

const MAX_ATTEMPTS = 6
let notificationSeq = 0
let processing = false

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ---- Buildings -----------------------------------------------------
      buildings: [],
      selectedBuildingId: null,

      selectBuilding: (id) => set({ selectedBuildingId: id }),

      addBuilding: async (name, folderInput) => {
        const trimmedName = name.trim()
        const folderId = extractFolderId(folderInput)
        if (!trimmedName) throw new Error('Le nom du bâtiment est requis.')
        if (!folderId) throw new Error("L'identifiant ou l'URL du dossier Google Drive est requis.")

        if (getStoredAccessToken()) {
          await verifyFolder(folderId, { interactive: false }).catch(() => {
            throw new Error("Dossier introuvable ou inaccessible avec ce compte Google. Vérifiez l'URL et les droits d'accès.")
          })
        }

        const building = { id: newId(), name: trimmedName, folderId }
        set((state) => ({
          buildings: [...state.buildings, building],
          selectedBuildingId: state.selectedBuildingId ?? building.id,
        }))
        return building
      },

      removeBuilding: (id) =>
        set((state) => ({
          buildings: state.buildings.filter((b) => b.id !== id),
          selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
        })),

      // ---- Auth ------------------------------------------------------------
      account: getStoredAccount(),
      isSignedIn: Boolean(getStoredAccessToken()),
      authConfigured: isConfigured(),

      signIn: async () => {
        const token = await requestAccessToken({ interactive: true })
        let account = null
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) account = await res.json()
        } catch {
          // Non-fatal: we still have a usable token even without profile info.
        }
        set({ isSignedIn: true, account })
        get().processQueue()
        return account
      },

      signOut: () => {
        googleSignOut()
        set({ isSignedIn: false, account: null })
      },

      // ---- Network -----------------------------------------------------
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setOnline: (online) => {
        set({ isOnline: online })
        if (online) get().processQueue()
      },

      // ---- Notifications (toasts) ---------------------------------------
      notifications: [],
      pushNotification: (type, message) => {
        const id = ++notificationSeq
        set((state) => ({ notifications: [...state.notifications, { id, type, message }] }))
        setTimeout(() => get().dismissNotification(id), 4500)
      },
      dismissNotification: (id) =>
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

      // ---- Upload queue ---------------------------------------------------
      queue: [],
      refreshQueue: async () => {
        const items = await listQueueItems()
        set({ queue: items.sort((a, b) => a.createdAt - b.createdAt) })
      },

      enqueuePhoto: async ({ blob, filename, building }) => {
        const item = {
          id: newId(),
          buildingId: building.id,
          buildingName: building.name,
          folderId: building.folderId,
          filename,
          blob,
          mimeType: blob.type || 'image/jpeg',
          createdAt: Date.now(),
          status: 'pending',
          progress: 0,
          attempts: 0,
          errorMessage: null,
        }
        await addQueueItem(item)
        await get().refreshQueue()
        get().processQueue()
        return item
      },

      retryQueueItem: async (id) => {
        await updateQueueItem(id, { status: 'pending', errorMessage: null, attempts: 0 })
        await get().refreshQueue()
        get().processQueue()
      },

      deleteQueueItem: async (id) => {
        await removeQueueItem(id)
        await get().refreshQueue()
      },

      processQueue: async () => {
        if (processing) return
        if (!get().isOnline) return
        const pending = get().queue.filter((i) => i.status === 'pending' || i.status === 'uploading')
        if (pending.length === 0) return

        if (!getStoredAccessToken()) {
          if (!get().isSignedIn) return
          set({ isSignedIn: false })
          get().pushNotification('error', 'Session Google expirée. Reconnectez-vous pour envoyer les photos en attente.')
          return
        }

        processing = true
        try {
          for (const item of get().queue) {
            if (item.status !== 'pending') continue
            if (!get().isOnline) break

            await updateQueueItem(item.id, { status: 'uploading', progress: 0 })
            await get().refreshQueue()

            try {
              const dateFolder = formatDateFolder(new Date(item.createdAt))
              const dailyFolderId = await getOrCreateDailyPhotoFolder(item.folderId, dateFolder, { interactive: false })
              await uploadFile(item.blob, item.filename, dailyFolderId, {
                interactive: false,
                onProgress: (fraction) => {
                  // Lightweight progress updates directly in state (skip IDB writes per tick).
                  set((state) => ({
                    queue: state.queue.map((q) => (q.id === item.id ? { ...q, progress: fraction } : q)),
                  }))
                },
              })
              await updateQueueItem(item.id, { status: 'done', progress: 1, errorMessage: null })
              get().pushNotification('success', `${item.filename} envoyée (${item.buildingName}).`)
              await removeQueueItem(item.id)
            } catch (err) {
              const attempts = item.attempts + 1
              const isAuthError = err?.status === 401 || err?.status === 403
              await updateQueueItem(item.id, {
                status: attempts >= MAX_ATTEMPTS || isAuthError ? 'error' : 'pending',
                attempts,
                errorMessage: err?.message ?? 'Erreur inconnue',
              })
              get().pushNotification('error', `Échec de l'envoi de ${item.filename} : ${err?.message ?? 'erreur inconnue'}`)
              if (isAuthError) {
                set({ isSignedIn: false })
                await get().refreshQueue()
                break
              }
            }
            await get().refreshQueue()
          }
        } finally {
          processing = false
        }
      },
    }),
    {
      name: 'ma2d-app-store',
      partialize: (state) => ({
        buildings: state.buildings,
        selectedBuildingId: state.selectedBuildingId,
      }),
    },
  ),
)

export function initNetworkListeners() {
  const update = () => useAppStore.getState().setOnline(navigator.onLine)
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
  return () => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  }
}
