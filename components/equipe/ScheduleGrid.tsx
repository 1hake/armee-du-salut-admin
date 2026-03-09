'use client'

import { useState } from 'react'
import type { GeneratedSchedule, WeekSchedule } from '@/lib/schedulerEngine'
import { DAYS_FR, MONTHS_FR } from '@/lib/weekUtils'

interface Props {
  schedule: GeneratedSchedule
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  work:         { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Travail' },
  weekend_work: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Weekend' },
  rest:         { bg: 'bg-gray-50', text: 'text-gray-400', label: 'Repos' },
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
      <div className="flex items-center gap-4 text-xs">
        {Object.entries(STATUS_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${style.bg} border border-border`} />
            <span className="text-muted">{style.label}</span>
          </div>
        ))}
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentWeekIdx((i) => Math.max(0, i - 1))}
          disabled={currentWeekIdx === 0}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-surface transition-colors disabled:opacity-30"
        >
          &larr;
        </button>
        <span className="text-sm font-medium">
          Semaine {currentWeekIdx + 1}/{schedule.weeks.length} — {formatWeekLabel(dates)}
        </span>
        <button
          onClick={() => setCurrentWeekIdx((i) => Math.min(schedule.weeks.length - 1, i + 1))}
          disabled={currentWeekIdx === schedule.weeks.length - 1}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-surface transition-colors disabled:opacity-30"
        >
          &rarr;
        </button>
      </div>

      {/* Grid */}
      <div className="border border-border rounded-lg bg-surface overflow-x-auto -mx-2 sm:mx-0">
        <div
          className="grid min-w-[600px]"
          style={{ gridTemplateColumns: '100px repeat(7, 1fr)' }}
        >
          {/* Header: day names + dates */}
          <div className="border-b border-r border-border bg-bg/50 px-2 py-2 text-xs font-medium text-muted" />
          {dates.map((d, i) => {
            const isWeekend = i >= 5
            return (
              <div
                key={i}
                className={`border-b border-border ${i < 6 ? 'border-r' : ''} px-2 py-2 text-center text-xs font-medium ${
                  isWeekend ? 'bg-amber-50/50' : 'bg-bg/50'
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
              <div className="border-b border-r border-border px-2 py-2 text-xs font-medium flex items-center">
                <span className="truncate">{emp.employeeName}</span>
                {emp.isWeekendWorker && (
                  <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1 rounded">WE</span>
                )}
              </div>
              {emp.days.map((day, i) => {
                const style = STATUS_STYLES[day.status]
                return (
                  <div
                    key={day.date}
                    className={`border-b border-border ${i < 6 ? 'border-r' : ''} px-1 py-2 text-center ${style.bg}`}
                  >
                    <div className={`text-[10px] font-medium ${style.text}`}>
                      {day.status === 'rest' ? '—' : `${day.hours}h`}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Week total row */}
          <div className="contents">
            <div className="border-r border-border px-2 py-2 text-xs font-bold bg-bg/50">
              Total jour
            </div>
            {dates.map((_, i) => {
              const totalForDay = week.employees.reduce((sum, emp) => sum + emp.days[i].hours, 0)
              const workersForDay = week.employees.filter((emp) => emp.days[i].status !== 'rest').length
              return (
                <div
                  key={i}
                  className={`border-border ${i < 6 ? 'border-r' : ''} px-1 py-2 text-center bg-bg/50`}
                >
                  <div className="text-[10px] font-bold">{totalForDay}h</div>
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
