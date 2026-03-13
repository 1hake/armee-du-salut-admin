// ── Types ───────────────────────────────────────────────

export type ShiftCode = 'M' | 'S' | 'J' | 'W' | 'R'
export type DayStatus = 'work' | 'rest' | 'weekend_work'

// Kept for backward compat with grid/summary
export type Shift = 'M' | 'S' | 'J' | 'W'

// ── Fixed shift definitions ─────────────────────────────

export const SHIFT_INFO: Record<ShiftCode, { label: string; time: string; hours: number; color: string }> = {
  M: { label: 'Matin',    time: '8h45–16h45', hours: 7, color: 'blue' },
  S: { label: 'Soir',     time: '10h15–18h15', hours: 7, color: 'amber' },
  J: { label: 'Journée',  time: '8h45–17h45', hours: 8, color: 'emerald' },
  W: { label: 'Week-end',  time: '9h00–17h00', hours: 7, color: 'violet' },
  R: { label: 'Repos',    time: '',            hours: 0, color: 'gray' },
}

export const HOURS_PER_WEEK = 35
export const CYCLE_WEEKS = 5

// ── Fixed 5-week cycle pattern (by position 0–4) ───────

const CYCLE_PATTERN: ShiftCode[][][] = [
  // Position 0
  [
    ['J','J','J','R','R','W','W'],
    ['R','J','J','J','J','R','R'],
    ['J','J','J','R','R','W','W'],
    ['R','J','J','J','J','R','R'],
    ['M','S','M','S','M','R','R'],
  ],
  // Position 1
  [
    ['J','J','J','R','R','W','W'],
    ['R','J','J','J','J','R','R'],
    ['S','M','S','M','S','R','R'],
    ['J','J','J','R','R','W','W'],
    ['R','J','J','J','J','R','R'],
  ],
  // Position 2
  [
    ['M','S','M','S','M','R','R'],
    ['J','J','J','R','R','W','W'],
    ['R','J','J','J','J','R','R'],
    ['J','J','J','R','R','W','W'],
    ['R','J','J','J','J','R','R'],
  ],
  // Position 3
  [
    ['S','M','S','M','S','R','R'],
    ['J','J','J','R','R','W','W'],
    ['R','J','J','J','J','R','R'],
    ['M','S','M','S','M','R','R'],
    ['M','S','M','R','R','W','W'],
  ],
  // Position 4
  [
    ['M','S','M','S','M','R','R'],
    ['S','M','S','M','S','R','R'],
    ['J','J','J','R','R','W','W'],
    ['R','J','J','J','J','R','R'],
    ['S','M','S','R','R','W','W'],
  ],
]

// Weekend worker positions per week of the cycle
const WEEKEND_POSITIONS: [number, number][] = [
  [0, 1],
  [2, 3],
  [0, 4],
  [1, 2],
  [3, 4],
]

// ── Data structures ─────────────────────────────────────

export interface EmployeeDay {
  date: string        // YYYY-MM-DD
  dayIndex: number    // 0=Lun … 6=Dim
  status: DayStatus
  shift: Shift | null
  hours: number
  presenceHours: number
  shiftCode: ShiftCode
}

export interface EmployeeWeek {
  employeeId: string
  employeeName: string
  weekKey: string
  days: EmployeeDay[]
  totalHours: number
  totalPresenceHours: number
  isWeekendWorker: boolean
}

export interface WeekSchedule {
  weekKey: string
  weekendWorkerIds: [string, string]
  employees: EmployeeWeek[]
}

export interface Violation {
  employeeId: string
  employeeName: string
  type: string
  message: string
  dates?: string[]
}

export interface GeneratedSchedule {
  weeks: WeekSchedule[]
  violations: Violation[]
  summary: EmployeeSummary[]
  cycleLength: number
}

export interface EmployeeSummary {
  employeeId: string
  employeeName: string
  totalWeekends: number
  totalHours: number
  totalPresenceHours: number
  totalWorkDays: number
  totalRestDays: number
  avgHoursPerWeek: number
  avgPresencePerWeek: number
  matinCount: number
  soirCount: number
  journeeCount: number
}

export interface Employee {
  id: string
  name: string
}

export interface GenerateOptions {
  employees: Employee[]
  startDate: string  // YYYY-MM-DD (must be a Monday)
  cycles?: number    // number of 5-week cycles (default 1)
}

// ── Helpers ─────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function shiftToStatus(code: ShiftCode): DayStatus {
  if (code === 'R') return 'rest'
  if (code === 'W') return 'weekend_work'
  return 'work'
}

function shiftToShift(code: ShiftCode): Shift | null {
  if (code === 'R') return null
  return code
}

// ── Main generator ──────────────────────────────────────

export function generateSchedule(options: GenerateOptions): GeneratedSchedule {
  const { employees, startDate } = options
  const cycles = options.cycles ?? 1
  const totalWeeks = cycles * CYCLE_WEEKS

  if (employees.length !== 5) {
    throw new Error('Exactement 5 salariés requis pour ce planning')
  }

  const allWeeks: WeekSchedule[] = []
  const lunchBreakHours = 1

  for (let c = 0; c < cycles; c++) {
    // Each cycle shifts positions by c (employee i gets position (i + c) % 5)
    const offset = c % 5

    for (let w = 0; w < CYCLE_WEEKS; w++) {
      const globalWeek = c * CYCLE_WEEKS + w
      const monday = addDays(parseDateStr(startDate), globalWeek * 7)
      const weekKey = formatDate(monday)

      // Weekend workers for this week (shifted positions)
      const [wp1, wp2] = WEEKEND_POSITIONS[w]
      // Find which employees occupy those positions after shift
      const ww1 = employees[(5 - offset + wp1) % 5]
      const ww2 = employees[(5 - offset + wp2) % 5]

      const employeeWeeks: EmployeeWeek[] = []

      for (let empIdx = 0; empIdx < employees.length; empIdx++) {
        const emp = employees[empIdx]
        const position = (empIdx + offset) % 5
        const weekPattern = CYCLE_PATTERN[position][w]
        const isWeekendWorker = weekPattern.includes('W')

        const days: EmployeeDay[] = []
        let weekHours = 0
        let weekPresence = 0

        for (let d = 0; d < 7; d++) {
          const date = formatDate(addDays(monday, d))
          const code = weekPattern[d]
          const hours = SHIFT_INFO[code].hours
          const presenceHours = code !== 'R' ? hours + lunchBreakHours : 0

          days.push({
            date,
            dayIndex: d,
            status: shiftToStatus(code),
            shift: shiftToShift(code),
            hours,
            presenceHours,
            shiftCode: code,
          })

          weekHours += hours
          weekPresence += presenceHours
        }

        employeeWeeks.push({
          employeeId: emp.id,
          employeeName: emp.name,
          weekKey,
          days,
          totalHours: weekHours,
          totalPresenceHours: weekPresence,
          isWeekendWorker,
        })
      }

      allWeeks.push({
        weekKey,
        weekendWorkerIds: [ww1.id, ww2.id],
        employees: employeeWeeks,
      })
    }
  }

  const summary = buildSummary(allWeeks, employees, totalWeeks)

  return { weeks: allWeeks, violations: [], summary, cycleLength: totalWeeks }
}

// ── Summary ─────────────────────────────────────────────

function buildSummary(
  weeks: WeekSchedule[],
  employees: Employee[],
  totalWeeks: number,
): EmployeeSummary[] {
  return employees.map((emp) => {
    let totalWeekends = 0
    let totalHours = 0
    let totalPresenceHours = 0
    let totalWorkDays = 0
    let totalRestDays = 0
    let matinCount = 0
    let soirCount = 0
    let journeeCount = 0

    for (const week of weeks) {
      const ew = week.employees.find((e) => e.employeeId === emp.id)
      if (!ew) continue
      if (ew.isWeekendWorker) totalWeekends++
      totalHours += ew.totalHours
      totalPresenceHours += ew.totalPresenceHours
      for (const day of ew.days) {
        if (day.status === 'rest') totalRestDays++
        else totalWorkDays++
        if (day.shiftCode === 'M') matinCount++
        if (day.shiftCode === 'S') soirCount++
        if (day.shiftCode === 'J') journeeCount++
      }
    }

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      totalWeekends,
      totalHours,
      totalPresenceHours,
      totalWorkDays,
      totalRestDays,
      avgHoursPerWeek: totalWeeks > 0 ? Math.round((totalHours / totalWeeks) * 10) / 10 : 0,
      avgPresencePerWeek: totalWeeks > 0 ? Math.round((totalPresenceHours / totalWeeks) * 10) / 10 : 0,
      matinCount,
      soirCount,
      journeeCount,
    }
  })
}
