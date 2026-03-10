'use client'

import type { EmployeeSummary, Violation, SchedulerConfig } from '@/lib/schedulerEngine'

interface Props {
  summary: EmployeeSummary[]
  violations: Violation[]
  weeks: number
  config: SchedulerConfig
}

export function ScheduleSummary({ summary, violations, weeks, config }: Props) {
  return (
    <div className="space-y-4">
      {/* Violations */}
      {violations.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4">
          <h3 className="text-[13px] font-semibold text-red-800 mb-2">
            Alertes ({violations.length})
          </h3>
          <ul className="space-y-1.5">
            {violations.map((v, i) => (
              <li key={i} className="text-[12px] text-red-700 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">&#9888;</span>
                <span>{v.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary table */}
      <div className="rounded-xl bg-surface border border-border/60 shadow-sm overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full text-[13px] min-w-[600px]">
          <thead>
            <tr className="border-b border-border/60 bg-bg/30">
              <th className="text-left px-3.5 py-2.5 text-[12px] font-medium text-muted">Salarie</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Weekends</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Jours travailles</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Jours repos</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Total heures</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-muted">Moy. h/sem</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-blue-500">Matin</th>
              <th className="text-center px-3.5 py-2.5 text-[12px] font-medium text-amber-500">Aprem</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => {
              const avgHoursPerWeek = s.avgHoursPerWeek.toFixed(1)
              const hoursOk = Math.abs(s.avgHoursPerWeek - config.hoursPerWeek) <= 1
              return (
                <tr key={s.employeeId} className="border-b border-border/40 last:border-0 hover:bg-bg/30 transition-colors">
                  <td className="px-3.5 py-2.5 font-medium">{s.employeeName}</td>
                  <td className="px-3.5 py-2.5 text-center">{s.totalWeekends}</td>
                  <td className="px-3.5 py-2.5 text-center">{s.totalWorkDays}</td>
                  <td className="px-3.5 py-2.5 text-center">{s.totalRestDays}</td>
                  <td className="px-3.5 py-2.5 text-center">{s.totalHours}h</td>
                  <td className={`px-3.5 py-2.5 text-center font-medium ${hoursOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {avgHoursPerWeek}h
                  </td>
                  <td className="px-3.5 py-2.5 text-center text-blue-600">{s.matinCount}</td>
                  <td className="px-3.5 py-2.5 text-center text-amber-600">{s.apremCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
