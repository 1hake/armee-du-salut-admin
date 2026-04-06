'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSavedSchedule, type SavedWeek } from '@/server/equipeActions'
import { SHIFT_INFO, CYCLE_WEEKS } from '@/lib/schedulerEngine'
import { DAYS_FR, MONTHS_FR } from '@/lib/weekUtils'

interface Props {
  initialWeeks: SavedWeek[]
}

const SHIFT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  M: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  S: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
  J: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  W: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400' },
}

export function PlanningView({ initialWeeks }: Props) {
  const { data: weeks = [] } = useQuery({
    queryKey: ['savedSchedule'],
    queryFn: () => getSavedSchedule(),
    initialData: initialWeeks,
  })

  const [currentWeekIdx, setCurrentWeekIdx] = useState(0)
  const week = weeks[currentWeekIdx]

  if (weeks.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <h1 className="text-[22px] font-bold mb-6">Planning d&apos;equipe</h1>
        <div className="border border-border rounded-lg p-8 sm:p-16 text-center text-muted text-[14px]">
          Aucun planning enregistre. Un administrateur doit d&apos;abord generer le planning.
        </div>
      </div>
    )
  }

  if (!week) return null

  const monday = parseDate(week.weekKey)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  const cycleNum = Math.floor(currentWeekIdx / CYCLE_WEEKS) + 1
  const weekInCycle = (currentWeekIdx % CYCLE_WEEKS) + 1

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <h1 className="text-[22px] font-bold mb-6">Planning d&apos;equipe</h1>

      <div className="space-y-3">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          {(['M', 'S', 'J', 'W'] as const).map((code) => {
            const info = SHIFT_INFO[code]
            const colors = SHIFT_COLORS[code]
            return (
              <div key={code} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <span className="text-muted">{info.label} ({info.time})</span>
              </div>
            )
          })}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-muted">Repos</span>
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeekIdx((i) => Math.max(0, i - 1))}
            disabled={currentWeekIdx === 0}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-hover transition-colors disabled:opacity-20"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8.5 3.5L5 7l3.5 3.5"/></svg>
          </button>
          <span className="text-[13px] font-medium">
            Cycle {cycleNum} · Semaine {weekInCycle}/{CYCLE_WEEKS} — {formatWeekLabel(dates)}
          </span>
          <button
            onClick={() => setCurrentWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
            disabled={currentWeekIdx === weeks.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-hover transition-colors disabled:opacity-20"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5.5 3.5L9 7l-3.5 3.5"/></svg>
          </button>
        </div>

        {/* Grid */}
        <div className="border border-border rounded-lg overflow-x-auto">
          <div className="grid min-w-[640px]" style={{ gridTemplateColumns: '100px repeat(7, 1fr)' }}>
            {/* Header */}
            <div className="border-b border-r border-border bg-surface-hover px-2 py-2 text-[12px] text-muted" />
            {dates.map((d, i) => (
              <div
                key={i}
                className={`border-b border-border ${i < 6 ? 'border-r' : ''} px-2 py-2 text-center text-[12px] ${
                  i >= 5 ? 'bg-purple-50/30' : 'bg-surface-hover'
                }`}
              >
                <div className="font-medium text-ink">{DAYS_FR[i]}</div>
                <div className="text-muted">{d.getDate()}/{d.getMonth() + 1}</div>
              </div>
            ))}

            {/* Rows */}
            {week.employees.map((emp) => (
              <div key={emp.employeeId} className="contents">
                <div className="border-b border-r border-border px-2.5 py-2 text-[12px] font-medium flex items-center">
                  <span className="truncate">{emp.employeeName}</span>
                </div>
                {emp.days.map((day, i) => (
                  <ShiftCell key={day.date} day={day} isLast={i === 6} />
                ))}
              </div>
            ))}

            {/* Total row */}
            <div className="contents">
              <div className="border-r border-border px-2.5 py-2 text-[12px] font-semibold text-muted bg-surface-hover">
                Total
              </div>
              {dates.map((_, i) => {
                const totalH = week.employees.reduce((sum, emp) => {
                  const day = emp.days.find((d) => d.dayIndex === i)
                  return sum + (day?.hours ?? 0)
                }, 0)
                const workers = week.employees.filter((emp) => {
                  const day = emp.days.find((d) => d.dayIndex === i)
                  return day && day.status !== 'rest'
                }).length
                return (
                  <div key={i} className={`border-border ${i < 6 ? 'border-r' : ''} px-1 py-2 text-center bg-surface-hover`}>
                    <div className="text-[11px] font-semibold">{totalH}h</div>
                    <div className="text-[9px] text-muted">{workers} pers.</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShiftCell({ day, isLast }: { day: { status: string; hours: number; shiftCode: string | null }; isLast: boolean }) {
  if (day.status === 'rest') {
    return (
      <div className={`border-b border-border ${!isLast ? 'border-r' : ''} px-1 py-1.5 text-center`}>
        <div className="text-[11px] text-muted/30">&mdash;</div>
      </div>
    )
  }

  const code = day.shiftCode ?? (day.status === 'weekend_work' ? 'W' : 'J')
  const colors = SHIFT_COLORS[code] ?? SHIFT_COLORS['J']
  const info = SHIFT_INFO[code as keyof typeof SHIFT_INFO]

  return (
    <div className={`border-b border-border ${!isLast ? 'border-r' : ''} px-1 py-1.5 text-center ${colors.bg}`}>
      <div className="space-y-0.5">
        <div className={`text-[12px] font-semibold ${colors.text} flex items-center justify-center gap-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} inline-block`} />
          {code}
        </div>
        <div className="text-[9px] text-muted">{info?.hours ?? day.hours}h</div>
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
  return `${first.getDate()} ${MONTHS_FR[first.getMonth()]} — ${last.getDate()} ${MONTHS_FR[last.getMonth()]} ${last.getFullYear()}`
}
