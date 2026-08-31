import { useEffect, useState } from 'react'
import Header from './components/Header'
import BuildingSelector from './components/BuildingSelector'
import AddBuildingSheet from './components/AddBuildingSheet'
import CaptureButton from './components/CaptureButton'
import QueuePanel from './components/QueuePanel'
import ToastStack from './components/ToastStack'
import { useAppStore, initNetworkListeners } from './store/useAppStore'

export default function App() {
  const buildings = useAppStore((s) => s.buildings)
  const refreshQueue = useAppStore((s) => s.refreshQueue)
  const processQueue = useAppStore((s) => s.processQueue)
  const authConfigured = useAppStore((s) => s.authConfigured)

  const [addOpen, setAddOpen] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)

  useEffect(() => {
    refreshQueue().then(() => processQueue())
    const cleanup = initNetworkListeners()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-full flex flex-col">
      <Header onOpenQueue={() => setQueueOpen(true)} />

      {!authConfigured && (
        <div className="mx-4 mt-3 rounded-xl bg-ma2d-amber/15 text-ma2d-amber text-xs font-medium px-3 py-2">
          Identifiant client Google (VITE_GOOGLE_CLIENT_ID) non configuré — voir le README pour activer l'envoi vers Drive.
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <BuildingSelector onAddBuilding={() => setAddOpen(true)} />

        {buildings.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">🏗️</div>
            <p className="text-white font-bold text-lg">Aucun bâtiment configuré</p>
            <p className="text-white/50 text-sm max-w-xs">
              Ajoutez votre premier bâtiment en associant son dossier Google Drive pour commencer à envoyer des photos.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="rounded-full bg-ma2d-orange px-6 py-3.5 font-bold text-ma2d-navy active:scale-95 transition-transform"
            >
              + Ajouter un bâtiment
            </button>
          </div>
        ) : (
          <CaptureButton />
        )}
      </main>

      <AddBuildingSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
      <ToastStack />
    </div>
  )
}
