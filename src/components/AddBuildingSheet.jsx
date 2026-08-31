import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export default function AddBuildingSheet({ open, onClose }) {
  const addBuilding = useAppStore((s) => s.addBuilding)
  const isSignedIn = useAppStore((s) => s.isSignedIn)
  const pushNotification = useAppStore((s) => s.pushNotification)
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const projectName = useAppStore((s) => s.projects.find((p) => p.id === s.selectedProjectId)?.name)
  const [name, setName] = useState('')
  const [folder, setFolder] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const close = () => {
    if (submitting) return
    setName('')
    setFolder('')
    setError(null)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await addBuilding(name, folder, selectedProjectId)
      pushNotification('success', `Bâtiment "${name.trim()}" ajouté au projet ${projectName}.`)
      setName('')
      setFolder('')
      onClose()
    } catch (err) {
      setError(err.message || "Impossible d'ajouter ce bâtiment.")
    } finally {
      setSubmitting(false)
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
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-ma2d-navy-light border-t border-white/10 px-5 pt-4 pb-8 safe-bottom max-h-[85vh] overflow-y-auto"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <h2 className="text-lg font-bold text-white mb-1">Nouveau bâtiment</h2>
            <p className="text-sm text-white/50 mb-5">
              Projet <span className="font-semibold text-white/80">{projectName}</span> — indiquez le lien OneDrive du
              dossier <span className="font-semibold text-white/80">"Photo"</span> de ce bâtiment (les sous-dossiers par
              date y seront créés automatiquement).
            </p>

            {!isSignedIn && (
              <div className="mb-4 rounded-xl bg-ma2d-amber/15 text-ma2d-amber text-xs font-medium px-3 py-2">
                Connectez-vous à Microsoft (bouton en haut de l'écran) avant d'ajouter un bâtiment : c'est nécessaire pour
                vérifier l'accès au dossier.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Nom du bâtiment</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Bâtiment G"
                  className="rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-ma2d-orange"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                  Lien du dossier "Photo" OneDrive
                </span>
                <input
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  placeholder="https://xxx-my.sharepoint.com/:f:/g/personal/..."
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
                  disabled={submitting || !isSignedIn}
                  className="flex-[2] rounded-xl bg-ma2d-orange py-3.5 font-bold text-ma2d-navy active:scale-95 transition-transform disabled:opacity-60"
                >
                  {submitting ? 'Vérification…' : !isSignedIn ? 'Connexion requise' : 'Ajouter le bâtiment'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
