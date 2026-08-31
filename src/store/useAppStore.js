import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signIn as msSignIn, signOut as msSignOut, getStoredAccount, isConfigured } from '../services/msAuth'
import { resolveShareLink, getOrCreateDateFolder, uploadFile } from '../services/oneDrive'
import { addQueueItem, updateQueueItem, listQueueItems, removeQueueItem } from '../services/uploadQueue'
import { formatDateFolder } from '../utils/filename'

const MAX_ATTEMPTS = 6
let notificationSeq = 0
let processing = false

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const DEFAULT_PROJECT_ID = 'projet-champfleury'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ---- Projects (e.g. "Champfleury") ----------------------------------
      projects: [{ id: DEFAULT_PROJECT_ID, name: 'Champfleury' }],
      selectedProjectId: DEFAULT_PROJECT_ID,

      addProject: (name) => {
        const trimmed = name.trim()
        if (!trimmed) throw new Error('Le nom du projet est requis.')
        const project = { id: newId(), name: trimmed }
        set((state) => ({ projects: [...state.projects, project], selectedProjectId: project.id }))
        return project
      },

      removeProject: (id) =>
        set((state) => {
          const projects = state.projects.filter((p) => p.id !== id)
          const buildings = state.buildings.filter((b) => b.projectId !== id)
          const selectedProjectId = state.selectedProjectId === id ? (projects[0]?.id ?? null) : state.selectedProjectId
          const selectedBuildingId = buildings.some((b) => b.id === state.selectedBuildingId)
            ? state.selectedBuildingId
            : (buildings.find((b) => b.projectId === selectedProjectId)?.id ?? null)
          return { projects, buildings, selectedProjectId, selectedBuildingId }
        }),

      selectProject: (id) =>
        set((state) => {
          const firstBuilding = state.buildings.find((b) => b.projectId === id)
          return { selectedProjectId: id, selectedBuildingId: firstBuilding?.id ?? null }
        }),

      // ---- Buildings (scoped to a project) --------------------------------
      buildings: [],
      selectedBuildingId: null,

      selectBuilding: (id) => set({ selectedBuildingId: id }),

      addBuilding: async (name, shareLink, projectId) => {
        const trimmedName = name.trim()
        const trimmedLink = shareLink.trim()
        if (!trimmedName) throw new Error('Le nom du bâtiment est requis.')
        if (!trimmedLink) throw new Error('Le lien du dossier "Photo" OneDrive est requis.')
        if (!projectId) throw new Error('Sélectionnez un projet.')
        if (!get().isSignedIn) {
          throw new Error("Connectez-vous à Microsoft avant d'ajouter un bâtiment (nécessaire pour vérifier l'accès au dossier).")
        }

        const { driveId, itemId } = await resolveShareLink(trimmedLink, { interactive: true }).catch((err) => {
          throw new Error(err.message || "Dossier introuvable ou inaccessible avec ce compte Microsoft. Vérifiez le lien et les droits d'accès.")
        })

        const building = { id: newId(), projectId, name: trimmedName, driveId, photoFolderId: itemId, photoFolderUrl: trimmedLink }
        set((state) => ({
          buildings: [...state.buildings, building],
          selectedBuildingId: state.selectedProjectId === projectId ? building.id : state.selectedBuildingId,
        }))
        return building
      },

      removeBuilding: (id) =>
        set((state) => ({
          buildings: state.buildings.filter((b) => b.id !== id),
          selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
        })),

      // ---- Auth (Microsoft / OneDrive) ------------------------------------
      account: null,
      isSignedIn: false,
      authConfigured: isConfigured(),

      restoreSession: async () => {
        const account = await getStoredAccount().catch(() => null)
        if (account) set({ account, isSignedIn: true })
      },

      signIn: async () => {
        const account = await msSignIn()
        set({ isSignedIn: true, account })
        get().processQueue()
        return account
      },

      signOut: async () => {
        await msSignOut()
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
          driveId: building.driveId,
          photoFolderId: building.photoFolderId,
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
        if (!get().isSignedIn) return

        processing = true
        try {
          for (const item of get().queue) {
            if (item.status !== 'pending') continue
            if (!get().isOnline) break

            await updateQueueItem(item.id, { status: 'uploading', progress: 0 })
            await get().refreshQueue()

            try {
              const dateFolder = formatDateFolder(new Date(item.createdAt))
              const dateFolderId = await getOrCreateDateFolder(item.driveId, item.photoFolderId, dateFolder, { interactive: false })
              await uploadFile(item.blob, item.filename, item.driveId, dateFolderId, {
                interactive: false,
                onProgress: (fraction) => {
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
        projects: state.projects,
        selectedProjectId: state.selectedProjectId,
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
