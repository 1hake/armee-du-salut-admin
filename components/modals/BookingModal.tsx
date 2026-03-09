'use client'

import { useState } from 'react'
import { DAYS_FR } from '@/lib/weekUtils'
import { getOrgColor } from '@/lib/orgColors'

interface Props {
  roomName: string
  dayIndex: number
  slot: number
  knownOrganisations: string[]
  onConfirm: (organisation: string) => void
  onClose: () => void
}

export function BookingModal({ roomName, dayIndex, slot, knownOrganisations, onConfirm, onClose }: Props) {
  const [organisation, setOrganisation] = useState('')

  const slotLabel = slot === 0 ? 'Matin' : 'Après-midi'
  const dayLabel = DAYS_FR[dayIndex]

  const filtered = organisation.trim()
    ? knownOrganisations.filter((o) => o.toLowerCase().includes(organisation.toLowerCase()))
    : knownOrganisations

  const handleConfirm = () => {
    if (organisation.trim()) onConfirm(organisation.trim())
  }

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
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ink/20"
          placeholder="Saisir ou sélectionner..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm()
          }}
        />

        {filtered.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 max-h-[120px] overflow-y-auto">
            {filtered.map((org) => {
              const { color, bg } = getOrgColor(org)
              const isSelected = organisation === org
              return (
                <button
                  key={org}
                  type="button"
                  onClick={() => setOrganisation(org)}
                  className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                  style={{
                    backgroundColor: bg,
                    color,
                    outline: isSelected ? `2px solid ${color}` : 'none',
                    outlineOffset: '1px',
                  }}
                >
                  {org}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-bg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
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
