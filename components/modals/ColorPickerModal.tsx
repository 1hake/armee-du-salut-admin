'use client'

import { useState } from 'react'
import { PALETTE } from '@/lib/orgColors'

interface Props {
  organisation: string
  currentColor: { color: string; bg: string }
  onConfirm: (color: string, bg: string) => void
  onReset: () => void
  onClose: () => void
}

export function ColorPickerModal({ organisation, currentColor, onConfirm, onReset, onClose }: Props) {
  const [selected, setSelected] = useState(currentColor)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-surface rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-xs animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 sm:px-6 sm:pt-6 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold">Couleur du tag</h2>
            <div className="mt-1.5">
              <span
                className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: selected.bg, color: selected.color }}
              >
                {organisation}
              </span>
            </div>
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
          {/* Preset palette */}
          <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">Couleurs prédéfinies</label>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {PALETTE.map((p, i) => {
              const isSelected = selected.color === p.color && selected.bg === p.bg
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(p)}
                  className="aspect-square rounded-lg transition-all hover:scale-110 flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: p.bg,
                    color: p.color,
                    boxShadow: isSelected ? `0 0 0 2px ${p.color}` : 'none',
                  }}
                >
                  Aa
                </button>
              )
            })}
          </div>

          {/* Custom color inputs */}
          <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">Personnalisée</label>
          <div className="flex gap-3 rounded-lg border border-border/60 bg-bg/30 p-3">
            <div className="flex-1">
              <label className="block text-[11px] text-muted mb-1">Texte</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selected.color}
                  onChange={(e) => setSelected((s) => ({ ...s, color: e.target.value }))}
                  className="w-8 h-8 rounded-md cursor-pointer border border-border/60 bg-transparent"
                />
                <span className="text-[11px] text-muted font-mono">{selected.color}</span>
              </div>
            </div>
            <div className="w-px bg-border/60" />
            <div className="flex-1">
              <label className="block text-[11px] text-muted mb-1">Fond</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selected.bg}
                  onChange={(e) => setSelected((s) => ({ ...s, bg: e.target.value }))}
                  className="w-8 h-8 rounded-md cursor-pointer border border-border/60 bg-transparent"
                />
                <span className="text-[11px] text-muted font-mono">{selected.bg}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/60">
            <button
              onClick={onReset}
              className="text-sm text-muted hover:text-ink transition-colors underline underline-offset-2 decoration-border hover:decoration-ink"
            >
              Réinitialiser
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => onConfirm(selected.color, selected.bg)}
                className="px-4 py-2 text-sm bg-ink text-bg rounded-lg hover:opacity-90 transition-opacity"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
