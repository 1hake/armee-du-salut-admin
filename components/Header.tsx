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
    <header className="mb-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight">
          Occupation des salles
        </h1>

        <button
          onClick={onAddRoom}
          className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-full hover:brightness-110 transition-all active:scale-95"
        >
          + Salle
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onToday}
          className="px-3.5 py-1.5 text-[13px] font-medium rounded-full border border-border hover:bg-surface transition-colors active:scale-95"
        >
          Aujourd&apos;hui
        </button>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrev}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors active:scale-95"
            aria-label="Semaine précédente"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3.5L5 7l3.5 3.5"/></svg>
          </button>
          <span className="px-3 text-[13px] font-medium min-w-[180px] sm:min-w-[210px] text-center">
            {label}
          </span>
          <button
            onClick={onNext}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors active:scale-95"
            aria-label="Semaine suivante"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 3.5L9 7l-3.5 3.5"/></svg>
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={onCopyPrevWeek}
            className="px-3.5 py-1.5 text-[13px] font-medium rounded-full border border-border hover:bg-surface transition-colors active:scale-95"
            title="Copier les réservations de la semaine précédente"
          >
            Copier sem. préc.
          </button>

          <button
            onClick={onExportExcel}
            className="px-3.5 py-1.5 text-[13px] font-medium rounded-full border border-border hover:bg-surface transition-colors active:scale-95"
            title="Télécharger le planning en Excel"
          >
            Export Excel
          </button>
        </div>
      </div>
    </header>
  )
}
