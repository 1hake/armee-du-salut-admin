'use client'

import { useState } from 'react'
import { DAYS_FR } from '@/lib/weekUtils'
import { getOrgColor } from '@/lib/orgColors'

interface Props {
  roomName: string
  dayIndex: number
  slot: number
  knownOrganisations: string[]
  customColors?: Record<string, { color: string; bg: string }>
  onConfirm: (organisation: string) => void
  onClose: () => void
}

export function BookingModal({ roomName, dayIndex, slot, knownOrganisations, customColors, onConfirm, onClose }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-surface rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-sm animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 sm:px-6 sm:pt-6 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold">Nouvelle réservation</h2>
            <p className="text-sm text-muted mt-0.5">
              {roomName} &middot; {dayLabel} {slotLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors -mr-1 -mt-1"
            aria-label="Fermer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <label className="block text-sm font-medium mb-1.5">Partenaire</label>
          <input
            type="text"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-bg/50 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all"
            placeholder="Saisir ou sélectionner..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
              if (e.key === 'Escape') onClose()
            }}
          />

          {filtered.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 max-h-[140px] overflow-y-auto rounded-lg border border-border bg-surface-hover p-2.5">
              {filtered.map((org) => {
                const { color, bg } = getOrgColor(org, customColors)
                const isSelected = organisation === org
                return (
                  <button
                    key={org}
                    type="button"
                    onClick={() => setOrganisation(org)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:scale-105"
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

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!organisation.trim()}
              className="px-4 py-2 text-sm bg-ink text-bg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              Réserver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
