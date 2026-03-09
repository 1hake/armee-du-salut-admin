'use client'

import { useState } from 'react'
import type { Employee } from '@/server/schema'

interface Props {
  employees: Employee[]
  onAdd: (name: string) => void
  onDelete: (id: string) => void
}

export function EmployeeList({ employees, onAdd, onDelete }: Props) {
  const [name, setName] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim())
    setName('')
  }

  return (
    <div className="rounded-xl bg-surface border border-border/60 shadow-sm p-4">
      <h2 className="text-[13px] font-semibold mb-3">Salaries ({employees.length})</h2>

      <ul className="space-y-0.5 mb-3">
        {employees.map((emp) => (
          <li key={emp.id} className="group flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-bg text-[13px] transition-colors">
            <span>{emp.name}</span>
            <button
              onClick={() => onDelete(emp.id)}
              className="sm:opacity-0 sm:group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du salarie"
          className="flex-1 border border-border rounded-lg px-3 py-2 text-[13px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="px-3.5 py-2 text-[13px] font-medium bg-accent text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-30 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  )
}
