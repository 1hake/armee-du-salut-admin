'use client'

import { parseWeekKey, getWeekDays, fmtWeekLabel } from '@/lib/weekUtils'

interface Props {
  weekKey: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onAddRoom: () => void
  onCopyPrevWeek: () => void
  onExportExcel: () => void
}

export function Header({ weekKey, onPrev, onNext, onToday, onAddRoom, onCopyPrevWeek, onExportExcel }: Props) {
  const monday = parseWeekKey(weekKey)
  const days = getWeekDays(monday)
  const label = fmtWeekLabel(days)

  return (
    <header className="flex items-center justify-between mb-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Plan d&apos;occupation des salles
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-surface transition-colors"
        >
          Aujourd&apos;hui
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-surface transition-colors"
            aria-label="Semaine précédente"
          >
            &larr;
          </button>
          <span className="px-3 text-sm font-medium min-w-[200px] text-center">
            {label}
          </span>
          <button
            onClick={onNext}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-surface transition-colors"
            aria-label="Semaine suivante"
          >
            &rarr;
          </button>
        </div>

        <button
          onClick={onCopyPrevWeek}
          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-surface transition-colors"
          title="Copier les réservations de la semaine précédente"
        >
          Copier sem. prec.
        </button>

        <button
          onClick={onExportExcel}
          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-surface transition-colors"
          title="Télécharger le planning en Excel"
        >
          Télécharger Excel
        </button>

        <button
          onClick={onAddRoom}
          className="px-3 py-1.5 text-sm bg-ink text-bg rounded-md hover:opacity-90 transition-opacity"
        >
          + Salle
        </button>
      </div>
    </header>
  )
}
