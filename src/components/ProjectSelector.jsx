import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export default function ProjectSelector({ onAddProject }) {
  const projects = useAppStore((s) => s.projects)
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const selectProject = useAppStore((s) => s.selectProject)

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Projet</h2>
        {projects.length > 0 && <span className="text-xs text-white/40">{projects.length} projet(s)</span>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
        {projects.map((p) => {
          const active = p.id === selectedProjectId
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => selectProject(p.id)}
              whileTap={{ scale: 0.95 }}
              className={`snap-start flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                active ? 'bg-ma2d-orange text-ma2d-navy' : 'bg-white/10 text-white/70'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0">
                <path
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              {p.name}
            </motion.button>
          )
        })}

        <motion.button
          type="button"
          onClick={onAddProject}
          whileTap={{ scale: 0.95 }}
          className="snap-start flex items-center gap-1.5 rounded-full border-2 border-dashed border-white/20 px-4 py-2.5 text-sm font-semibold text-white/60 whitespace-nowrap"
        >
          <span className="text-base leading-none">+</span> Nouveau projet
        </motion.button>
      </div>
    </div>
  )
}
