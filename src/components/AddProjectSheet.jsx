import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export default function AddProjectSheet({ open, onClose }) {
  const addProject = useAppStore((s) => s.addProject)
  const pushNotification = useAppStore((s) => s.pushNotification)
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  const close = () => {
    setName('')
    setError(null)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    try {
      addProject(name)
      pushNotification('success', `Projet "${name.trim()}" créé.`)
      close()
    } catch (err) {
      setError(err.message || 'Impossible de créer ce projet.')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={close}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-ma2d-navy-light border-t border-white/10 px-5 pt-4 pb-8 safe-bottom"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <h2 className="text-lg font-bold text-white mb-1">Nouveau projet</h2>
            <p className="text-sm text-white/50 mb-5">
              Un projet regroupe plusieurs bâtiments (ex. "Champfleury" avec les bâtiments A, B, C…).
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Nom du projet</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Champfleury"
                  className="rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-ma2d-orange"
                  required
                />
              </label>

              {error && <p className="text-sm font-medium text-ma2d-red">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 rounded-xl bg-white/10 py-3.5 font-semibold text-white active:scale-95 transition-transform"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-[2] rounded-xl bg-ma2d-orange py-3.5 font-bold text-ma2d-navy active:scale-95 transition-transform"
                >
                  Créer le projet
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
