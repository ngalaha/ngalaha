import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { formatPhotoFilename, extensionFromMime } from '../utils/filename'

export default function CaptureButton() {
  const buildings = useAppStore((s) => s.buildings)
  const selectedBuildingId = useAppStore((s) => s.selectedBuildingId)
  const enqueuePhoto = useAppStore((s) => s.enqueuePhoto)
  const pushNotification = useAppStore((s) => s.pushNotification)

  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const [flash, setFlash] = useState(null) // { url } for the instant visual feedback

  const building = buildings.find((b) => b.id === selectedBuildingId) ?? null

  const handleFiles = async (fileList) => {
    if (!building) {
      pushNotification('error', "Sélectionnez d'abord un bâtiment.")
      return
    }
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return

    const previewUrl = URL.createObjectURL(files[0])
    setFlash({ url: previewUrl })
    setTimeout(() => setFlash(null), 1200)

    const baseTime = Date.now()
    for (const [index, file] of files.entries()) {
      const captureDate = new Date(baseTime + index * 1000)
      const filename = formatPhotoFilename(captureDate, extensionFromMime(file.type))
      try {
        await enqueuePhoto({ blob: file, filename, building })
      } catch (err) {
        pushNotification('error', err.message || "Impossible de mettre la photo en file d'attente.")
      }
    }
    pushNotification('info', files.length > 1 ? `${files.length} photos en file d'envoi.` : 'Photo mise en file d’envoi.')
  }

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-8">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="relative">
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute -top-3 -right-3 h-16 w-16 rounded-2xl overflow-hidden ring-4 ring-ma2d-green shadow-xl z-10"
            >
              <img src={flash.url} alt="" className="h-full w-full object-cover" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => cameraInputRef.current?.click()}
          disabled={!building}
          className="flex h-40 w-40 items-center justify-center rounded-full bg-ma2d-orange shadow-[0_10px_40px_-10px_rgba(237,123,33,0.7)] disabled:opacity-40 disabled:shadow-none"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-ma2d-navy">
            <path
              d="M4 8a2 2 0 012-2h1.5l1-1.5h7l1 1.5H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="3.3" stroke="currentColor" strokeWidth="2" />
          </svg>
        </motion.button>
      </div>

      <p className="text-lg font-bold text-white">Prendre une photo</p>
      <p className="text-sm text-white/50 -mt-3 text-center max-w-xs">
        {building ? `Envoi vers "${building.name}"` : 'Sélectionnez un bâtiment ci-dessus'}
      </p>

      <button
        type="button"
        onClick={() => galleryInputRef.current?.click()}
        disabled={!building}
        className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="8" cy="9" r="1.5" fill="currentColor" />
        </svg>
        Importer depuis la galerie
      </button>
    </div>
  )
}
