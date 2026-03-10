'use client'

import { useState } from 'react'
import { getWeekKey } from '@/lib/weekUtils'
import type { SchedulerConfig } from '@/lib/schedulerEngine'

interface Props {
  disabled: boolean
  loading: boolean
  employeeCount: number
  config: SchedulerConfig
  onGenerate: (startDate: string, weeks?: number) => void
}

export function GenerateForm({ disabled, loading, employeeCount, config, onGenerate }: Props) {
  const [startDate, setStartDate] = useState(() => getWeekKey(new Date()))
  const [useCustomWeeks, setUseCustomWeeks] = useState(false)
  const [customWeeks, setCustomWeeks] = useState(5)

  // Auto cycle: N for even, 2N for odd
  const autoCycle = employeeCount <= 1 ? 2
    : employeeCount % 2 === 0 ? employeeCount : employeeCount * 2

  return (
    <div className="rounded-xl bg-surface border border-border/60 shadow-sm p-4">
      <h2 className="text-[13px] font-semibold mb-3">Generer le planning</h2>

      {/* Shift info */}
      <div className="rounded-lg bg-bg/50 border border-border/40 p-3 mb-4 space-y-1.5">
        <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Horaires</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[12px]">{config.shifts.matin.label} : {config.shifts.matin.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[12px]">{config.shifts.aprem.label} : {config.shifts.aprem.time}</span>
        </div>
        <div className="text-[11px] text-muted mt-1">
          Pause dej : {config.lunchBreak} &middot; {config.hoursPerDay}h/jour &middot; {config.hoursPerWeek}h/semaine
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-muted mb-1.5">Semaine de debut (lundi)</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-muted mb-1.5">Duree du cycle</label>
          <div className="flex items-center gap-2 mb-1.5">
            <button
              type="button"
              onClick={() => setUseCustomWeeks(false)}
              className={`flex-1 px-3 py-2 text-[12px] rounded-lg border transition-all ${
                !useCustomWeeks ? 'border-ink bg-ink text-bg font-medium' : 'border-border hover:bg-bg'
              }`}
            >
              Auto ({autoCycle} sem.)
            </button>
            <button
              type="button"
              onClick={() => setUseCustomWeeks(true)}
              className={`flex-1 px-3 py-2 text-[12px] rounded-lg border transition-all ${
                useCustomWeeks ? 'border-ink bg-ink text-bg font-medium' : 'border-border hover:bg-bg'
              }`}
            >
              Personnalise
            </button>
          </div>
          {!useCustomWeeks && (
            <p className="text-[11px] text-muted">
              Cycle optimal calcule pour {employeeCount} salaries : rotation equitable des weekends et horaires
            </p>
          )}
          {useCustomWeeks && (
            <select
              value={customWeeks}
              onChange={(e) => setCustomWeeks(Number(e.target.value))}
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} semaine{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={() => onGenerate(startDate, useCustomWeeks ? customWeeks : undefined)}
          disabled={disabled || loading}
          className="w-full px-4 py-2.5 text-[13px] font-medium bg-accent text-white rounded-full hover:brightness-110 transition-all disabled:opacity-30 active:scale-[0.98]"
        >
          {loading ? 'Generation...' : 'Generer le planning'}
        </button>

        {disabled && (
          <p className="text-[12px] text-red-500">Au moins 2 salaries requis</p>
        )}
      </div>
    </div>
  )
}
