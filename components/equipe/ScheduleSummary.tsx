'use client'

import type { EmployeeSummary } from '@/lib/schedulerEngine'
import { HOURS_PER_WEEK } from '@/lib/schedulerEngine'

interface Props {
  summary: EmployeeSummary[]
  weeks: number
}

export function ScheduleSummary({ summary, weeks }: Props) {
  return (
    <div className="space-y-4">
      {/* Summary table */}
      <div className="rounded-xl bg-surface border border-border/60 shadow-sm overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full text-[13px] min-w-[600px]">
          <thead>
            <tr className="border-b border-border/60 bg-bg/30">
              <th className="text-left px-3.5 py-2.5 text-[12px] font-medium text-muted">Salarie</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Weekends</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Jours travailles</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Jours repos</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">H. travail</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Moy./sem</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-blue-500">Matin</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-amber-500">Soir</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-emerald-500">Journee</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => {
              const avgWork = s.avgHoursPerWeek.toFixed(1)
              const hoursOk = Math.abs(s.avgHoursPerWeek - HOURS_PER_WEEK) <= 1
              return (
                <tr key={s.employeeId} className="border-b border-border/40 last:border-0 hover:bg-bg/30 transition-colors">
                  <td className="px-3.5 py-2.5 font-medium">{s.employeeName}</td>
                  <td className="px-3.5 py-2.5 text-center">{s.totalWeekends}</td>
                  <td className="px-3.5 py-2.5 text-center">{s.totalWorkDays}</td>
                  <td className="px-3.5 py-2.5 text-center">{s.totalRestDays}</td>
                  <td className="px-3.5 py-2.5 text-center">{s.totalHours}h</td>
                  <td className={`px-3.5 py-2.5 text-center font-medium ${hoursOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {avgWork}h
                  </td>
                  <td className="px-3.5 py-2.5 text-center text-blue-600">{s.matinCount}</td>
                  <td className="px-3.5 py-2.5 text-center text-amber-600">{s.soirCount}</td>
                  <td className="px-3.5 py-2.5 text-center text-emerald-600">{s.journeeCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
