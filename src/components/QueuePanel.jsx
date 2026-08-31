import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const STATUS_LABEL = {
  pending: 'En attente',
  uploading: 'Envoi en cours…',
  error: 'Échec',
  done: 'Envoyée',
}

function QueueItemRow({ item }) {
  const retryQueueItem = useAppStore((s) => s.retryQueueItem)
  const deleteQueueItem = useAppStore((s) => s.deleteQueueItem)
  const thumbUrl = useMemo(() => URL.createObjectURL(item.blob), [item.blob])
  useEffect(() => () => URL.revokeObjectURL(thumbUrl), [thumbUrl])

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="flex items-center gap-3 rounded-2xl bg-white/5 p-3"
    >
      <img src={thumbUrl} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{item.filename}</p>
        <p className="truncate text-xs text-white/50">{item.buildingName}</p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          {item.status === 'uploading' ? (
            <motion.div
              className="h-full rounded-full bg-ma2d-orange"
              animate={{ width: `${Math.max(6, item.progress * 100)}%` }}
              transition={{ ease: 'easeOut' }}
            />
          ) : item.status === 'done' ? (
            <div className="h-full w-full rounded-full bg-ma2d-green" />
          ) : item.status === 'error' ? (
            <div className="h-full w-full rounded-full bg-ma2d-red/70" />
          ) : (
            <div className="h-full w-1/4 rounded-full bg-white/25" />
          )}
        </div>
        <p
          className={`mt-1 text-[11px] font-medium ${
            item.status === 'error' ? 'text-ma2d-red' : item.status === 'done' ? 'text-ma2d-green' : 'text-white/40'
          }`}
        >
          {STATUS_LABEL[item.status]}
          {item.status === 'error' && item.errorMessage ? ` · ${item.errorMessage}` : ''}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {item.status === 'error' && (
          <button
            type="button"
            onClick={() => retryQueueItem(item.id)}
            className="rounded-lg bg-ma2d-orange/20 p-2 text-ma2d-orange active:scale-90 transition-transform"
            aria-label="Réessayer"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M4 4v5h5M20 20v-5h-5M4.6 15a8 8 0 0014.8-2M19.4 9A8 8 0 004.6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => deleteQueueItem(item.id)}
          className="rounded-lg bg-white/10 p-2 text-white/60 active:scale-90 transition-transform"
          aria-label="Supprimer"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.li>
  )
}

export default function QueuePanel({ open, onClose }) {
  const queue = useAppStore((s) => s.queue)
  const isOnline = useAppStore((s) => s.isOnline)
  const isSignedIn = useAppStore((s) => s.isSignedIn)

  const pending = queue.filter((i) => i.status !== 'done')

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-ma2d-navy-light border-t border-white/10 px-5 pt-4 pb-6 safe-bottom max-h-[80vh] flex flex-col"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-white">File d'envoi</h2>
              <button type="button" onClick={onClose} className="text-white/50 text-sm font-semibold">
                Fermer
              </button>
            </div>

            {!isOnline && (
              <p className="mb-3 rounded-xl bg-ma2d-red/15 text-ma2d-red text-xs font-medium px-3 py-2">
                Hors ligne — les photos sont sauvegardées et seront envoyées automatiquement au retour du réseau.
              </p>
            )}
            {isOnline && !isSignedIn && pending.length > 0 && (
              <p className="mb-3 rounded-xl bg-ma2d-amber/15 text-ma2d-amber text-xs font-medium px-3 py-2">
                Connectez-vous à Google pour envoyer les photos en attente.
              </p>
            )}

            <ul className="flex flex-col gap-2.5 overflow-y-auto">
              <AnimatePresence initial={false}>
                {pending.length === 0 && (
                  <p className="py-8 text-center text-sm text-white/40">Aucune photo en attente. Tout est envoyé ✓</p>
                )}
                {pending.map((item) => (
                  <QueueItemRow key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
