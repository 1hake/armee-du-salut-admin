'use client'

import { useState, useRef, useEffect } from 'react'
import type { Employee } from '@/server/schema'

interface Props {
  employees: Employee[]
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function EmployeeList({ employees, onAdd, onRename, onDelete }: Props) {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editingId])

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim())
    setName('')
  }

  const startEditing = (emp: Employee) => {
    setEditingId(emp.id)
    setEditName(emp.name)
  }

  const commitEdit = () => {
    if (editingId && editName.trim() && editName.trim() !== employees.find((e) => e.id === editingId)?.name) {
      onRename(editingId, editName.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="rounded-xl bg-surface border border-border/60 shadow-sm p-4">
      <h2 className="text-[13px] font-semibold mb-3">Salaries ({employees.length}/5)</h2>

      <ul className="space-y-0.5 mb-3">
        {employees.map((emp) => (
          <li key={emp.id} className="group flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-bg text-[13px] transition-colors">
            {editingId === emp.id ? (
              <input
                ref={editRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 mr-2 border border-accent/40 rounded px-2 py-0.5 text-[13px] bg-bg/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            ) : (
              <span
                className="cursor-pointer flex-1"
                onDoubleClick={() => startEditing(emp)}
                title="Double-cliquer pour renommer"
              >
                {emp.name}
              </span>
            )}
            <div className="flex items-center gap-1">
              {editingId !== emp.id && (
                <button
                  onClick={() => startEditing(emp)}
                  className="sm:opacity-0 sm:group-hover:opacity-100 text-muted hover:text-accent transition-opacity"
                  title="Renommer"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 1.5l2 2M1 11l.5-2L9 1.5l2 2L3.5 11z"/></svg>
                </button>
              )}
              <button
                onClick={() => onDelete(emp.id)}
                className="sm:opacity-0 sm:group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
              </button>
            </div>
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
