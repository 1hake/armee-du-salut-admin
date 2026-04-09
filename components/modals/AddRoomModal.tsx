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

  const handleSubmit = () => {
    if (name.trim()) onConfirm(floor, name.trim(), capacity ? parseInt(capacity) : undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-surface rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-sm animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 sm:px-6 sm:pt-6 pb-3">
          <h2 className="font-display text-lg font-bold">Ajouter une salle</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors -mr-1 -mt-1"
            aria-label="Fermer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Étage</label>
            <div className="flex gap-1.5">
              {FLOORS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFloor(f)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                    floor === f
                      ? 'border-ink bg-ink text-bg font-medium'
                      : 'border-border hover:bg-bg'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nom de la salle</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-bg/50 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all"
              placeholder="Ex: Bureau médical"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
                if (e.key === 'Escape') onClose()
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Capacité <span className="text-muted font-normal">(optionnel)</span></label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-bg/50 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all pr-12"
                placeholder="Ex: 12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                  if (e.key === 'Escape') onClose()
                }}
              />
              {capacity && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">pers.</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="px-4 py-2 text-sm bg-ink text-bg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
