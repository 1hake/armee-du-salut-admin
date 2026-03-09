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
    <div className="border border-border rounded-lg bg-surface p-4">
      <h2 className="font-display text-sm font-bold mb-3">Salaries ({employees.length})</h2>

      <ul className="space-y-1 mb-3">
        {employees.map((emp) => (
          <li key={emp.id} className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-bg text-sm">
            <span>{emp.name}</span>
            <button
              onClick={() => onDelete(emp.id)}
              className="sm:opacity-0 sm:group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity"
            >
              &times;
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
          className="flex-1 border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="px-3 py-1.5 text-sm bg-ink text-bg rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}
