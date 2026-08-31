import { useEffect, useState } from 'react'
import Header from './components/Header'
import ProjectSelector from './components/ProjectSelector'
import AddProjectSheet from './components/AddProjectSheet'
import BuildingSelector from './components/BuildingSelector'
import AddBuildingSheet from './components/AddBuildingSheet'
import CaptureButton from './components/CaptureButton'
import QueuePanel from './components/QueuePanel'
import ToastStack from './components/ToastStack'
import { useAppStore, initNetworkListeners } from './store/useAppStore'

export default function App() {
  const buildings = useAppStore((s) => s.buildings)
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const refreshQueue = useAppStore((s) => s.refreshQueue)
  const processQueue = useAppStore((s) => s.processQueue)
  const restoreSession = useAppStore((s) => s.restoreSession)
  const authConfigured = useAppStore((s) => s.authConfigured)

  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [addBuildingOpen, setAddBuildingOpen] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)

  const projectBuildings = buildings.filter((b) => b.projectId === selectedProjectId)

  useEffect(() => {
    restoreSession().then(() => processQueue())
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
          Identifiant d'application Microsoft (VITE_MS_CLIENT_ID) non configuré — voir le README pour activer l'envoi
          vers OneDrive.
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <ProjectSelector onAddProject={() => setAddProjectOpen(true)} />
        <BuildingSelector onAddBuilding={() => setAddBuildingOpen(true)} />

        {projectBuildings.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">🏗️</div>
            <p className="text-white font-bold text-lg">Aucun bâtiment configuré</p>
            <p className="text-white/50 text-sm max-w-xs">
              Ajoutez un bâtiment en associant le lien de son dossier "Photo" OneDrive pour commencer à envoyer des
              photos.
            </p>
            <button
              type="button"
              onClick={() => setAddBuildingOpen(true)}
              className="rounded-full bg-ma2d-orange px-6 py-3.5 font-bold text-ma2d-navy active:scale-95 transition-transform"
            >
              + Ajouter un bâtiment
            </button>
          </div>
        ) : (
          <CaptureButton />
        )}
      </main>

      <AddProjectSheet open={addProjectOpen} onClose={() => setAddProjectOpen(false)} />
      <AddBuildingSheet open={addBuildingOpen} onClose={() => setAddBuildingOpen(false)} />
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
      <ToastStack />
    </div>
  )
}
