'use client'

import { useState } from 'react'
import { DAYS_FR } from '@/lib/weekUtils'

interface Props {
  roomName: string
  dayIndex: number
  slot: number
  onConfirm: (organisation: string) => void
  onClose: () => void
}

export function BookingModal({ roomName, dayIndex, slot, onConfirm, onClose }: Props) {
  const [organisation, setOrganisation] = useState('')

  const slotLabel = slot === 0 ? 'Matin' : 'Après-midi'
  const dayLabel = DAYS_FR[dayIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-bold mb-1">Nouvelle réservation</h2>
        <p className="text-sm text-muted mb-4">
          {roomName} &middot; {dayLabel} {slotLabel}
        </p>

        <label className="block text-sm font-medium mb-1">Organisation</label>
        <input
          type="text"
          value={organisation}
          onChange={(e) => setOrganisation(e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ink/20"
          placeholder="Ex: MSF, MDM, CRF..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && organisation.trim()) {
              onConfirm(organisation.trim())
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
            onClick={() => organisation.trim() && onConfirm(organisation.trim())}
            disabled={!organisation.trim()}
            className="px-3 py-1.5 text-sm bg-ink text-bg rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  )
}
