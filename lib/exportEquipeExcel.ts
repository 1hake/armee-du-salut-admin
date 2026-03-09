import * as XLSX from 'xlsx'
import type { GeneratedSchedule } from './schedulerEngine'
import { SHIFT_LABELS } from './schedulerEngine'
import { DAYS_FR, MONTHS_FR } from './weekUtils'

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function exportEquipeToExcel(schedule: GeneratedSchedule) {
  const wb = XLSX.utils.book_new()

  for (let wIdx = 0; wIdx < schedule.weeks.length; wIdx++) {
    const week = schedule.weeks[wIdx]
    const monday = parseDate(week.weekKey)
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return d
    })

    // Header row: empty + day names with dates
    const header: string[] = ['Salarié']
    for (let i = 0; i < 7; i++) {
      header.push(`${DAYS_FR[i]} ${dates[i].getDate()}/${dates[i].getMonth() + 1}`)
    }
    header.push('Total heures')

    const data: (string | number)[][] = [header]

    // Employee rows
    for (const emp of week.employees) {
      const row: (string | number)[] = [
        emp.employeeName + (emp.isWeekendWorker ? ' (WE)' : ''),
      ]
      for (const day of emp.days) {
        if (day.status === 'rest') {
          row.push('Repos')
        } else {
          const shiftLabel = day.shift ? SHIFT_LABELS[day.shift].time : ''
          row.push(`${day.hours}h — ${shiftLabel}`)
        }
      }
      row.push(emp.totalHours)
      data.push(row)
    }

    // Total row
    const totalRow: (string | number)[] = ['Total jour']
    for (let i = 0; i < 7; i++) {
      const totalH = week.employees.reduce((sum, emp) => sum + emp.days[i].hours, 0)
      const workers = week.employees.filter((emp) => emp.days[i].status !== 'rest').length
      totalRow.push(`${totalH}h (${workers} pers.)`)
    }
    totalRow.push(week.employees.reduce((sum, emp) => sum + emp.totalHours, 0))
    data.push(totalRow)

    const ws = XLSX.utils.aoa_to_sheet(data)

    ws['!cols'] = [
      { wch: 20 },
      ...Array(7).fill({ wch: 22 }),
      { wch: 14 },
    ]

    const label = `Sem ${wIdx + 1}`
    XLSX.utils.book_append_sheet(wb, ws, label)
  }

  // Summary sheet
  if (schedule.summary.length > 0) {
    const summaryHeader = ['Salarié', 'Weekends', 'Jours travaillés', 'Jours repos', 'Heures totales', 'Matin', 'Après-midi']
    const summaryData: (string | number)[][] = [summaryHeader]
    for (const s of schedule.summary) {
      summaryData.push([s.employeeName, s.totalWeekends, s.totalWorkDays, s.totalRestDays, s.totalHours, s.matinCount, s.apremCount])
    }
    const ws = XLSX.utils.aoa_to_sheet(summaryData)
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Résumé')
  }

  const startKey = schedule.weeks[0]?.weekKey ?? 'planning'
  XLSX.writeFile(wb, `planning-equipe-${startKey}.xlsx`)
}
