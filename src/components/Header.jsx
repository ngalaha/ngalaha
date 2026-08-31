import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export default function Header({ onOpenQueue }) {
  const isOnline = useAppStore((s) => s.isOnline)
  const isSignedIn = useAppStore((s) => s.isSignedIn)
  const account = useAppStore((s) => s.account)
  const signIn = useAppStore((s) => s.signIn)
  const signOut = useAppStore((s) => s.signOut)
  const pushNotification = useAppStore((s) => s.pushNotification)
  const queueCount = useAppStore((s) => s.queue.filter((i) => i.status !== 'done').length)

  const handleAuthClick = async () => {
    try {
      if (isSignedIn) {
        await signOut()
      } else {
        await signIn()
      }
    } catch (err) {
      pushNotification('error', err.message || 'Connexion Microsoft impossible.')
    }
  }

  return (
    <header className="safe-top sticky top-0 z-30 bg-ma2d-navy/95 backdrop-blur border-b border-white/10">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ma2d-orange font-black text-ma2d-navy text-lg">
            M
          </div>
          <div className="leading-tight">
            <p className="font-bold text-white text-base">MA2D Photos</p>
            <p className="text-[11px] text-white/50">Gestion photos chantier</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenQueue}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform"
            aria-label="File d'envoi"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path d="M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {queueCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ma2d-orange px-1 text-[11px] font-bold text-ma2d-navy"
              >
                {queueCount}
              </motion.span>
            )}
          </button>

          <span
            className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isOnline ? 'bg-ma2d-green/15 text-ma2d-green' : 'bg-ma2d-red/15 text-ma2d-red'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-ma2d-green' : 'bg-ma2d-red'}`} />
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>

          <button
            type="button"
            onClick={handleAuthClick}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
          >
            {isSignedIn ? (
              <>
                <span className="h-6 w-6 rounded-full bg-ma2d-green/80 flex items-center justify-center text-[10px] font-bold uppercase">
                  {account?.initial ?? 'M'}
                </span>
                <span className="hidden sm:inline">Déconnexion</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 23 23" className="h-4 w-4" fill="none">
                  <path fill="#F25022" d="M1 1h10v10H1z" />
                  <path fill="#7FBA00" d="M12 1h10v10H12z" />
                  <path fill="#00A4EF" d="M1 12h10v10H1z" />
                  <path fill="#FFB900" d="M12 12h10v10H12z" />
                </svg>
                Connexion Microsoft
              </>
            )}
          </button>
        </div>
      </div>
      <div className="sm:hidden px-4 pb-2 -mt-1">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isOnline ? 'bg-ma2d-green/15 text-ma2d-green' : 'bg-ma2d-red/15 text-ma2d-red'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-ma2d-green' : 'bg-ma2d-red'}`} />
          {isOnline ? 'En ligne' : 'Hors ligne — les photos seront envoyées au retour du réseau'}
        </span>
      </div>
    </header>
  )
}
