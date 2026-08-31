import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const STYLES = {
  success: { bg: 'bg-ma2d-green', icon: '✓' },
  error: { bg: 'bg-ma2d-red', icon: '!' },
  info: { bg: 'bg-ma2d-navy-light border border-white/15', icon: 'i' },
}

export default function ToastStack() {
  const notifications = useAppStore((s) => s.notifications)
  const dismissNotification = useAppStore((s) => s.dismissNotification)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pb-6 safe-bottom pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => {
          const style = STYLES[n.type] ?? STYLES.info
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              onClick={() => dismissNotification(n.id)}
              className={`pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl text-white text-sm font-medium ${style.bg}`}
            >
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {style.icon}
              </span>
              {n.message}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
