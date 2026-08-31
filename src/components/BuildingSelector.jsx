import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const PALETTE = ['#ed7b21', '#1fa15a', '#3a7fe8', '#d8433b', '#8a5ce0', '#e8a93a']

function colorFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export default function BuildingSelector({ onAddBuilding }) {
  const buildings = useAppStore((s) => s.buildings)
  const selectedBuildingId = useAppStore((s) => s.selectedBuildingId)
  const selectBuilding = useAppStore((s) => s.selectBuilding)

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Bâtiment</h2>
        {buildings.length > 0 && <span className="text-xs text-white/40">{buildings.length} bâtiment(s)</span>}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {buildings.map((b) => {
          const active = b.id === selectedBuildingId
          return (
            <motion.button
              key={b.id}
              type="button"
              onClick={() => selectBuilding(b.id)}
              whileTap={{ scale: 0.94 }}
              className={`snap-start flex flex-col items-center justify-center gap-1.5 min-w-[92px] h-24 rounded-2xl px-3 border-2 transition-colors ${
                active ? 'border-ma2d-orange bg-ma2d-orange/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white text-sm"
                style={{ backgroundColor: colorFor(b.id) }}
              >
                {b.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-white text-center leading-tight line-clamp-2 max-w-[80px]">
                {b.name}
              </span>
            </motion.button>
          )
        })}

        <motion.button
          type="button"
          onClick={onAddBuilding}
          whileTap={{ scale: 0.94 }}
          className="snap-start flex flex-col items-center justify-center gap-1.5 min-w-[92px] h-24 rounded-2xl border-2 border-dashed border-white/20 text-white/60"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xl leading-none">+</span>
          <span className="text-xs font-semibold">Ajouter</span>
        </motion.button>
      </div>
    </div>
  )
}
