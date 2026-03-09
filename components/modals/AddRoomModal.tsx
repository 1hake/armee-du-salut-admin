'use client'

import { useState } from 'react'

const FLOORS = ['RDC', 'R+1', 'R+2', 'R+3']

interface Props {
  onConfirm: (floor: string, name: string, capacity?: number) => void
  onClose: () => void
}

export function AddRoomModal({ onConfirm, onClose }: Props) {
  const [floor, setFloor] = useState('RDC')
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-surface rounded-t-xl sm:rounded-lg shadow-lg p-5 sm:p-6 w-full sm:max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-bold mb-4">Ajouter une salle</h2>

        <label className="block text-sm font-medium mb-1">Etage</label>
        <select
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ink/20"
        >
          {FLOORS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <label className="block text-sm font-medium mb-1">Nom de la salle</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ink/20"
          placeholder="Ex: Bureau médical"
          autoFocus
        />

        <label className="block text-sm font-medium mb-1">Capacité (optionnel)</label>
        <input
          type="number"
          min="1"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ink/20"
          placeholder="Ex: 12"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) {
              onConfirm(floor, name.trim(), capacity ? parseInt(capacity) : undefined)
            }
          }}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-bg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => name.trim() && onConfirm(floor, name.trim(), capacity ? parseInt(capacity) : undefined)}
            disabled={!name.trim()}
            className="px-3 py-1.5 text-sm bg-ink text-bg rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
