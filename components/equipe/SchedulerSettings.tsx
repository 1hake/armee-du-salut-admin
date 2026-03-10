'use client'

import { useState } from 'react'
import type { SchedulerConfig } from '@/lib/schedulerEngine'
import { DEFAULT_CONFIG } from '@/lib/schedulerEngine'

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface Props {
  config: SchedulerConfig
  onSave: (config: SchedulerConfig) => void
  saving: boolean
}

export function SchedulerSettings({ config, onSave, saving }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<SchedulerConfig>(config)

  const update = <K extends keyof SchedulerConfig>(key: K, value: SchedulerConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const toggleDay = (field: 'weekendWorkerWorkDays' | 'weekendWorkerRestDays', day: number) => {
    setDraft((prev) => {
      const arr = prev[field]
      const next = arr.includes(day) ? arr.filter((d) => d !== day) : [...arr, day].sort()
      return { ...prev, [field]: next }
    })
  }

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(config)

  return (
    <div className="rounded-xl bg-surface border border-border/60 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center justify-between text-[13px] font-semibold hover:bg-bg/30 transition-colors rounded-xl"
      >
        <span>Regles du planning</span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M3.5 5.5L7 9l3.5-3.5"/>
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3">
          {/* Horaires */}
          <section className="space-y-2">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider">Horaires</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-muted mb-1">Heures/jour</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={draft.hoursPerDay}
                  onChange={(e) => update('hoursPerDay', Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted mb-1">Heures/semaine</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="60"
                  value={draft.hoursPerWeek}
                  onChange={(e) => update('hoursPerWeek', Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">Pause dejeuner</label>
              <input
                type="text"
                value={draft.lunchBreak}
                onChange={(e) => update('lunchBreak', e.target.value)}
                className="w-full border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </section>

          {/* Shifts */}
          <section className="space-y-2">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider">Shifts</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                <input
                  type="text"
                  value={draft.shifts.matin.label}
                  onChange={(e) => setDraft((p) => ({ ...p, shifts: { ...p.shifts, matin: { ...p.shifts.matin, label: e.target.value } } }))}
                  className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={draft.shifts.matin.time}
                  onChange={(e) => setDraft((p) => ({ ...p, shifts: { ...p.shifts, matin: { ...p.shifts.matin, time: e.target.value } } }))}
                  className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Horaire"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <input
                  type="text"
                  value={draft.shifts.aprem.label}
                  onChange={(e) => setDraft((p) => ({ ...p, shifts: { ...p.shifts, aprem: { ...p.shifts.aprem, label: e.target.value } } }))}
                  className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={draft.shifts.aprem.time}
                  onChange={(e) => setDraft((p) => ({ ...p, shifts: { ...p.shifts, aprem: { ...p.shifts.aprem, time: e.target.value } } }))}
                  className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Horaire"
                />
              </div>
            </div>
          </section>

          {/* Contraintes */}
          <section className="space-y-2">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider">Contraintes</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-muted mb-1">Max jours travail consecutifs</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={draft.maxConsecutiveWorkDays}
                  onChange={(e) => update('maxConsecutiveWorkDays', Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted mb-1">Min jours repos consecutifs</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={draft.minConsecutiveRestDays}
                  onChange={(e) => update('minConsecutiveRestDays', Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-[12px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.enforceRecoveryMonday}
                onChange={(e) => update('enforceRecoveryMonday', e.target.checked)}
                className="rounded border-border accent-accent"
              />
              <span className="text-[12px]">Repos lundi apres un weekend travaille</span>
            </label>
          </section>

          {/* Weekend worker days */}
          <section className="space-y-2">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider">Jours travailles (semaine weekend)</div>
            <div className="flex gap-1">
              {DAYS_FR.map((label, i) => {
                const active = draft.weekendWorkerWorkDays.includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay('weekendWorkerWorkDays', i)}
                    className={`flex-1 py-1.5 text-[11px] rounded-lg border transition-all ${
                      active
                        ? 'border-ink bg-ink text-bg font-medium'
                        : 'border-border hover:bg-bg/50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider">Jours repos (semaine weekend)</div>
            <div className="flex gap-1">
              {DAYS_FR.map((label, i) => {
                const active = draft.weekendWorkerRestDays.includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay('weekendWorkerRestDays', i)}
                    className={`flex-1 py-1.5 text-[11px] rounded-lg border transition-all ${
                      active
                        ? 'border-red-300 bg-red-50 text-red-700 font-medium'
                        : 'border-border hover:bg-bg/50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setDraft(DEFAULT_CONFIG) }}
              className="flex-1 px-3 py-2 text-[12px] rounded-lg border border-border hover:bg-bg/50 transition-colors"
            >
              Reinitialiser
            </button>
            <button
              onClick={() => onSave(draft)}
              disabled={saving || !hasChanges}
              className="flex-1 px-3 py-2 text-[12px] font-medium rounded-lg bg-accent text-white hover:brightness-110 transition-all disabled:opacity-30"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
