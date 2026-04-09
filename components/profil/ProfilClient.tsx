'use client'

import { useState, useRef } from 'react'
import type { SavedWeek } from '@/server/equipeActions'
import { SHIFT_INFO } from '@/lib/schedulerEngine'
import { DAYS_FR, MONTHS_FR } from '@/lib/weekUtils'

interface Props {
  weeks: SavedWeek[]
  employeeName: string
}

const SHIFT_STYLE: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  M: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Matin', dot: 'bg-blue-400' },
  S: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Soir', dot: 'bg-orange-400' },
  J: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Journée', dot: 'bg-emerald-400' },
  W: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Week-end', dot: 'bg-purple-400' },
}

const DAYS_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export function ProfilClient({ weeks, employeeName }: Props) {
  const [currentWeekIdx, setCurrentWeekIdx] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    const idx = weeks.findIndex((w) => w.weekKey >= today)
    return idx >= 0 ? Math.max(0, idx - 1) : Math.max(0, weeks.length - 1)
  })

  const touchStartX = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 60) {
      if (diff < 0 && currentWeekIdx < weeks.length - 1) setCurrentWeekIdx((i) => i + 1)
      if (diff > 0 && currentWeekIdx > 0) setCurrentWeekIdx((i) => i - 1)
    }
  }

  if (weeks.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center py-16 text-muted text-[15px]">
          Aucun planning pour le moment.
        </div>
      </div>
    )
  }

  const week = weeks[currentWeekIdx]
  if (!week) return null
  const emp = week.employees[0]
  if (!emp) return null

  const monday = parseDate(week.weekKey)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  const today = new Date().toISOString().slice(0, 10)
  const totalHours = emp.days.reduce((sum, d) => sum + d.hours, 0)
  const workDays = emp.days.filter((d) => d.status !== 'rest').length

  return (
    <div
      className="max-w-lg mx-auto px-4 py-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentWeekIdx((i) => Math.max(0, i - 1))}
          disabled={currentWeekIdx === 0}
          className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-surface-hover transition-colors disabled:opacity-20"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-4 4 4 4"/></svg>
        </button>
        <div className="text-center min-w-0">
          <div className="text-[15px] font-semibold text-ink truncate">{formatWeekLabel(dates)}</div>
          <div className="text-[13px] text-muted">{workDays} jours — {totalHours}h</div>
        </div>
        <button
          onClick={() => setCurrentWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
          disabled={currentWeekIdx === weeks.length - 1}
          className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-surface-hover transition-colors disabled:opacity-20"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
        </button>
      </div>

      {/* Days list */}
      <div className="space-y-1.5">
        {emp.days.map((day, i) => {
          const isToday = day.date === today
          const isRest = day.status === 'rest'
          const code = day.shiftCode ?? (day.status === 'weekend_work' ? 'W' : 'J')
          const style = SHIFT_STYLE[code]
          const info = SHIFT_INFO[code as keyof typeof SHIFT_INFO]
          const date = dates[i]
          const isWeekend = i >= 5

          return (
            <div
              key={day.date}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isToday
                  ? 'bg-accent-light ring-1 ring-accent/20'
                  : isRest
                    ? 'opacity-50'
                    : 'hover:bg-surface-hover'
              }`}
            >
              {/* Date column */}
              <div className={`w-11 text-center shrink-0 ${isToday ? 'text-accent' : ''}`}>
                <div className="text-[11px] font-medium text-muted uppercase tracking-wide">{DAYS_FR[i]}</div>
                <div className={`text-[22px] font-bold leading-tight ${isToday ? 'text-accent' : 'text-ink'}`}>{date.getDate()}</div>
              </div>

              {/* Divider */}
              <div className={`w-px h-10 shrink-0 ${isToday ? 'bg-accent/20' : 'bg-border'}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {isRest ? (
                  <div className="text-[14px] text-muted">Repos</div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${style?.dot ?? 'bg-gray-300'}`} />
                      <span className={`text-[14px] font-medium ${style?.text ?? 'text-ink'}`}>
                        {info?.label ?? code}
                      </span>
                    </div>
                    <div className="text-[12px] text-muted mt-0.5">{info?.time}</div>
                  </>
                )}
              </div>

              {/* Hours badge */}
              {!isRest && (
                <div className={`text-[13px] font-semibold tabular-nums ${style?.text ?? 'text-ink'}`}>
                  {day.hours}h
                </div>
              )}

              {/* Today indicator */}
              {isToday && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Swipe hint on mobile */}
      <div className="text-center text-[11px] text-muted mt-4 md:hidden">
        Glissez pour changer de semaine
      </div>
    </div>
  )
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatWeekLabel(dates: Date[]): string {
  const first = dates[0]
  const last = dates[6]
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} — ${last.getDate()} ${MONTHS_FR[last.getMonth()]} ${last.getFullYear()}`
  }
  return `${first.getDate()} ${MONTHS_FR[first.getMonth()]} — ${last.getDate()} ${MONTHS_FR[last.getMonth()]} ${last.getFullYear()}`
}
