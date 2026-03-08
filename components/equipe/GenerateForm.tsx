'use client'

import { useState } from 'react'
import { getWeekKey } from '@/lib/weekUtils'

interface Props {
  disabled: boolean
  loading: boolean
  onGenerate: (startDate: string, weeks: number, weekdayHours: number, weekendHours: number) => void
}

export function GenerateForm({ disabled, loading, onGenerate }: Props) {
  const [startDate, setStartDate] = useState(() => getWeekKey(new Date()))
  const [weeks, setWeeks] = useState(5)
  const [weekdayHours, setWeekdayHours] = useState(7)
  const [weekendHours, setWeekendHours] = useState(8)
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="border border-border rounded-lg bg-surface p-4">
      <h2 className="font-display text-sm font-bold mb-3">Generer le planning</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Semaine de debut (lundi)</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Nombre de semaines</label>
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} semaine{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-muted hover:text-ink transition-colors"
        >
          {showAdvanced ? '▾' : '▸'} Parametres avances
        </button>

        {showAdvanced && (
          <div className="space-y-3 pl-2 border-l-2 border-border">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Heures/jour semaine</label>
              <input
                type="number"
                min={1}
                max={12}
                value={weekdayHours}
                onChange={(e) => setWeekdayHours(Number(e.target.value))}
                className="w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Heures/jour weekend</label>
              <input
                type="number"
                min={1}
                max={12}
                value={weekendHours}
                onChange={(e) => setWeekendHours(Number(e.target.value))}
                className="w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>
          </div>
        )}

        <button
          onClick={() => onGenerate(startDate, weeks, weekdayHours, weekendHours)}
          disabled={disabled || loading}
          className="w-full px-3 py-2 text-sm bg-ink text-bg rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? 'Generation...' : 'Generer le planning'}
        </button>

        {disabled && (
          <p className="text-xs text-red-500">Au moins 2 salaries requis</p>
        )}
      </div>
    </div>
  )
}
