'use client'

import { useState } from 'react'
import type { Employee, ScheduleOverride } from '@/server/schema'

interface Props {
  overrides: ScheduleOverride[]
  employees: Employee[]
  onAdd: (employeeId: string, date: string, description: string) => void
  onDelete: (id: string) => void
}

export function ScheduleOverrides({ overrides, employees, onAdd, onDelete }: Props) {
  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')

  const employeeMap = new Map(employees.map((e) => [e.id, e.name]))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !date || !description.trim()) return
    onAdd(employeeId, date, description.trim())
    setDescription('')
    setDate('')
  }

  return (
    <div className="rounded-lg bg-surface border border-border p-4 space-y-4">
      <h3 className="text-[14px] font-semibold">Changements ponctuels</h3>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1">
          <label className="text-[11px] text-muted">Salarie</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="block w-full text-[13px] border border-border rounded-lg px-2.5 py-1.5 bg-bg focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="">—</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-muted">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block text-[13px] border border-border rounded-lg px-2.5 py-1.5 bg-bg focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="space-y-1 flex-1 min-w-[180px]">
          <label className="text-[11px] text-muted">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Repos maladie, Echange avec..."
            className="block w-full text-[13px] border border-border rounded-lg px-2.5 py-1.5 bg-bg focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <button
          type="submit"
          disabled={!employeeId || !date || !description.trim()}
          className="px-3.5 py-1.5 text-[13px] font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 active:scale-95"
        >
          Ajouter
        </button>
      </form>

      {overrides.length > 0 && (
        <div className="space-y-1.5">
          {overrides.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 text-[13px] py-1.5 px-2.5 rounded-lg bg-bg/50 group"
            >
              <span className="font-medium whitespace-nowrap">
                {employeeMap.get(o.employeeId) ?? '?'}
              </span>
              <span className="text-muted whitespace-nowrap">{formatDate(o.date)}</span>
              <span className="flex-1 truncate">{o.description}</span>
              <button
                onClick={() => onDelete(o.id)}
                className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted hover:text-red-500 flex-shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {overrides.length === 0 && (
        <p className="text-[12px] text-muted">Aucun changement ponctuel enregistre.</p>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
