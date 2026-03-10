'use client'

import { useState } from 'react'
import type { GeneratedSchedule } from '@/lib/schedulerEngine'
import { SHIFT_LABELS } from '@/lib/schedulerEngine'
import { DAYS_FR, MONTHS_FR } from '@/lib/weekUtils'

interface Props {
  schedule: GeneratedSchedule
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  work:         { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Travail' },
  weekend_work: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Weekend' },
  rest:         { bg: 'bg-gray-50/50', text: 'text-gray-300', label: 'Repos' },
}

const SHIFT_COLORS = {
  matin: { dot: 'bg-blue-400', text: 'text-blue-600' },
  aprem: { dot: 'bg-amber-400', text: 'text-amber-600' },
}

export function ScheduleGrid({ schedule }: Props) {
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0)
  const week = schedule.weeks[currentWeekIdx]

  if (!week) return null

  const monday = parseDate(week.weekKey)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        {Object.entries(STATUS_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-md ${style.bg} border border-border/40`} />
            <span className="text-muted">{style.label}</span>
          </div>
        ))}
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-muted">{SHIFT_LABELS.matin.label} ({SHIFT_LABELS.matin.time})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-muted">{SHIFT_LABELS.aprem.label} ({SHIFT_LABELS.aprem.time})</span>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentWeekIdx((i) => Math.max(0, i - 1))}
          disabled={currentWeekIdx === 0}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors disabled:opacity-30 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3.5L5 7l3.5 3.5"/></svg>
        </button>
        <span className="text-[13px] font-medium">
          Semaine {currentWeekIdx + 1}/{schedule.weeks.length} — {formatWeekLabel(dates)}
        </span>
        <button
          onClick={() => setCurrentWeekIdx((i) => Math.min(schedule.weeks.length - 1, i + 1))}
          disabled={currentWeekIdx === schedule.weeks.length - 1}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors disabled:opacity-30 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 3.5L9 7l-3.5 3.5"/></svg>
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-xl bg-surface border border-border/60 shadow-sm overflow-x-auto -mx-2 sm:mx-0">
        <div
          className="grid min-w-[700px]"
          style={{ gridTemplateColumns: '110px repeat(7, 1fr)' }}
        >
          {/* Header: day names + dates */}
          <div className="border-b border-r border-border/60 bg-bg/30 px-2 py-2.5 text-[12px] font-medium text-muted" />
          {dates.map((d, i) => {
            const isWeekend = i >= 5
            return (
              <div
                key={i}
                className={`border-b border-border/60 ${i < 6 ? 'border-r' : ''} px-2 py-2.5 text-center text-[12px] font-medium ${
                  isWeekend ? 'bg-amber-50/30' : 'bg-bg/30'
                }`}
              >
                <div>{DAYS_FR[i]}</div>
                <div className="text-muted">{d.getDate()}/{d.getMonth() + 1}</div>
              </div>
            )
          })}

          {/* Employee rows */}
          {week.employees.map((emp) => (
            <div key={emp.employeeId} className="contents">
              <div className="border-b border-r border-border/60 px-2.5 py-2 text-[12px] font-medium flex items-center">
                <span className="truncate">{emp.employeeName}</span>
                {emp.isWeekendWorker && (
                  <span className="ml-1.5 text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">WE</span>
                )}
              </div>
              {emp.days.map((day, i) => {
                const style = STATUS_STYLES[day.status]
                const shiftColor = day.shift ? SHIFT_COLORS[day.shift] : null
                return (
                  <div
                    key={day.date}
                    className={`border-b border-border/60 ${i < 6 ? 'border-r' : ''} px-1 py-1.5 text-center ${style.bg}`}
                  >
                    {day.status === 'rest' ? (
                      <div className="text-[11px] text-gray-300">—</div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className={`text-[11px] font-medium ${style.text}`}>
                          {Number.isInteger(day.hours) ? day.hours : day.hours.toFixed(1)}h
                        </div>
                        {day.shift && shiftColor && (
                          <div className={`text-[9px] font-medium ${shiftColor.text} flex items-center justify-center gap-0.5`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${shiftColor.dot} inline-block`} />
                            {day.shift === 'matin' ? 'M' : 'AM'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Week total row */}
          <div className="contents">
            <div className="border-r border-border/60 px-2.5 py-2.5 text-[12px] font-semibold bg-bg/30">
              Total jour
            </div>
            {dates.map((_, i) => {
              const totalForDay = week.employees.reduce((sum, emp) => sum + emp.days[i].hours, 0)
              const workersForDay = week.employees.filter((emp) => emp.days[i].status !== 'rest').length
              return (
                <div
                  key={i}
                  className={`border-border/60 ${i < 6 ? 'border-r' : ''} px-1 py-2 text-center bg-bg/30`}
                >
                  <div className="text-[11px] font-semibold">{Number.isInteger(totalForDay) ? totalForDay : totalForDay.toFixed(1)}h</div>
                  <div className="text-[9px] text-muted">{workersForDay} pers.</div>
                </div>
              )
            })}
          </div>
        </div>
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
