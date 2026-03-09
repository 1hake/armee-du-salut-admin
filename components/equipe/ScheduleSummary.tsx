'use client'

import type { EmployeeSummary, Violation } from '@/lib/schedulerEngine'

interface Props {
  summary: EmployeeSummary[]
  violations: Violation[]
  weeks: number
}

export function ScheduleSummary({ summary, violations, weeks }: Props) {
  return (
    <div className="space-y-4">
      {/* Violations */}
      {violations.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <h3 className="text-sm font-bold text-red-800 mb-2">
            Alertes ({violations.length})
          </h3>
          <ul className="space-y-1">
            {violations.map((v, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">&#9888;</span>
                <span>{v.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary table */}
      <div className="border border-border rounded-lg bg-surface overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-bg/50">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted">Salarie</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-muted">Weekends</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-muted">Jours travailles</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-muted">Jours repos</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-muted">Total heures</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-muted">Moy. h/sem</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => {
              const avgHoursPerWeek = weeks > 0 ? (s.totalHours / weeks).toFixed(1) : '0'
              const hoursOk = Math.abs(s.totalHours / weeks - 35) <= 3
              return (
                <tr key={s.employeeId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{s.employeeName}</td>
                  <td className="px-3 py-2 text-center">{s.totalWeekends}</td>
                  <td className="px-3 py-2 text-center">{s.totalWorkDays}</td>
                  <td className="px-3 py-2 text-center">{s.totalRestDays}</td>
                  <td className="px-3 py-2 text-center">{s.totalHours}h</td>
                  <td className={`px-3 py-2 text-center font-medium ${hoursOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {avgHoursPerWeek}h
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
