// Persistent offline queue for pending photo uploads, backed by IndexedDB.
// Photos are stored locally the instant they're captured; a separate
// processor (see store/useAppStore.js) drains this queue whenever the
// network is available, so a flaky site connection never loses a photo.

import { openDB } from 'idb'

const DB_NAME = 'ma2d-photo-queue'
const DB_VERSION = 1
const STORE = 'queue'

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      },
    })
  }
  return dbPromise
}

export async function addQueueItem(item) {
  const db = await getDb()
  await db.put(STORE, item)
  return item
}

export async function updateQueueItem(id, patch) {
  const db = await getDb()
  const existing = await db.get(STORE, id)
  if (!existing) return null
  const updated = { ...existing, ...patch }
  await db.put(STORE, updated)
  return updated
}

export async function listQueueItems() {
  const db = await getDb()
  const items = await db.getAllFromIndex(STORE, 'createdAt')
  return items
}

export async function removeQueueItem(id) {
  const db = await getDb()
  await db.delete(STORE, id)
}

export async function clearCompletedItems() {
  const db = await getDb()
  const items = await db.getAll(STORE)
  await Promise.all(items.filter((i) => i.status === 'done').map((i) => db.delete(STORE, i.id)))
}
