'use client'

import { useState } from 'react'
import { getWeekKey } from '@/lib/weekUtils'
import { SHIFT_INFO, CYCLE_WEEKS } from '@/lib/schedulerEngine'

interface Props {
  disabled: boolean
  loading: boolean
  employeeCount: number
  onGenerate: (startDate: string, cycles?: number) => void
}

export function GenerateForm({ disabled, loading, employeeCount, onGenerate }: Props) {
  const [startDate, setStartDate] = useState(() => getWeekKey(new Date()))
  const [cycles, setCycles] = useState(1)

  const needsExactly5 = employeeCount !== 5

  return (
    <div className="rounded-lg bg-surface border border-border p-4">
      <h2 className="text-[13px] font-semibold mb-3">Générer le planning</h2>

      {/* Shift info */}
      <div className="rounded-lg bg-bg/50 border border-border p-3 mb-4 space-y-1.5">
        <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Horaires</div>
        {(['M', 'S', 'J', 'W'] as const).map((code) => {
          const info = SHIFT_INFO[code]
          const dotColor = code === 'M' ? 'bg-blue-400' : code === 'S' ? 'bg-amber-400' : code === 'J' ? 'bg-emerald-400' : 'bg-violet-400'
          return (
            <div key={code} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
              <span className="text-[12px]">{info.label} : {info.time} ({info.hours}h)</span>
            </div>
          )
        })}
        <div className="text-[11px] text-muted mt-1">
          Pause déj : 13h–14h &middot; 35h/semaine lissées sur le cycle
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-muted mb-1.5">Semaine de début (lundi)</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-muted mb-1.5">Nombre de cycles ({CYCLE_WEEKS} semaines/cycle)</label>
          <select
            value={cycles}
            onChange={(e) => setCycles(Number(e.target.value))}
            className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
          >
            {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} cycle{n > 1 ? 's' : ''} ({n * CYCLE_WEEKS} semaines)</option>
            ))}
          </select>
          <p className="text-[11px] text-muted mt-1">
            L&apos;ordre des salariés tourne à chaque cycle pour une rotation équitable
          </p>
        </div>

        <button
          onClick={() => onGenerate(startDate, cycles)}
          disabled={needsExactly5 || loading}
          className="w-full px-4 py-2.5 text-[13px] font-medium bg-accent text-white rounded-md hover:brightness-110 transition-all disabled:opacity-30 active:scale-[0.98]"
        >
          {loading ? 'Génération...' : 'Générer le planning'}
        </button>

        {needsExactly5 && (
          <p className="text-[12px] text-red-500">Exactement 5 salariés requis</p>
        )}
      </div>
    </div>
  )
}
