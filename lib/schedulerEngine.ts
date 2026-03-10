// ── Types ───────────────────────────────────────────────

export type DayStatus = 'work' | 'rest' | 'weekend_work'
export type Shift = 'matin' | 'aprem'

// ── Scheduler Config ────────────────────────────────────

export interface SchedulerConfig {
  hoursPerDay: number
  hoursPerWeek: number
  lunchBreak: string
  shifts: {
    matin: { label: string; time: string }
    aprem: { label: string; time: string }
  }
  maxConsecutiveWorkDays: number
  minConsecutiveRestDays: number
  enforceRecoveryMonday: boolean
  weekendWorkerWorkDays: number[]   // day indices (0=Lun) where weekend workers work
  weekendWorkerRestDays: number[]   // day indices where weekend workers rest
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  hoursPerDay: 7,
  hoursPerWeek: 35,
  lunchBreak: '13h – 14h',
  shifts: {
    matin: { label: 'Matin', time: '8h45 – 16h45' },
    aprem: { label: 'Après-midi', time: '10h15 – 18h15' },
  },
  maxConsecutiveWorkDays: 6,
  minConsecutiveRestDays: 2,
  enforceRecoveryMonday: true,
  weekendWorkerWorkDays: [0, 1, 2, 5, 6],  // Mon-Wed + Sat-Sun
  weekendWorkerRestDays: [3, 4],             // Thu-Fri
}

// Keep backward-compat exports (used by some components)
export const SHIFT_LABELS = DEFAULT_CONFIG.shifts
export const HOURS_PER_DAY = DEFAULT_CONFIG.hoursPerDay
export const HOURS_PER_WEEK = DEFAULT_CONFIG.hoursPerWeek
export const LUNCH_BREAK = DEFAULT_CONFIG.lunchBreak

export interface EmployeeDay {
  date: string        // YYYY-MM-DD
  dayIndex: number    // 0=Lun … 6=Dim
  status: DayStatus
  shift: Shift | null // null for rest
  hours: number       // hoursPerDay for work, 0 for rest
}

export interface EmployeeWeek {
  employeeId: string
  employeeName: string
  weekKey: string
  days: EmployeeDay[]
  totalHours: number
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
  type: 'consecutive_days' | 'hours_mismatch' | 'insufficient_consecutive_rest'
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
  totalWorkDays: number
  totalRestDays: number
  avgHoursPerWeek: number
  matinCount: number
  apremCount: number
}

export interface Employee {
  id: string
  name: string
}

export interface GenerateOptions {
  employees: Employee[]
  startDate: string  // YYYY-MM-DD (must be a Monday)
  weeks?: number     // if omitted, auto-calculated cycle length
  config?: SchedulerConfig
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

// ── Auto cycle length ───────────────────────────────────

function computeCycleLength(employeeCount: number): number {
  if (employeeCount <= 2) return 2
  return employeeCount % 2 === 0 ? employeeCount : employeeCount * 2
}

// ── Weekend rotation ────────────────────────────────────

function generateWeekendRotation(
  employeeIds: string[],
  weeks: number,
): [string, string][] {
  const n = employeeIds.length
  if (n < 2) throw new Error('Au moins 2 salariés requis')

  const allPairs: [number, number][] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allPairs.push([i, j])
    }
  }

  let baseCycle: [number, number][]

  if (n === 5) {
    baseCycle = [[0, 1], [2, 3], [4, 0], [1, 2], [3, 4]]
  } else {
    baseCycle = []
    const count = new Array(n).fill(0)
    const used = new Set<string>()
    const cycleLen = Math.ceil(n / 2) * 2

    for (let w = 0; w < cycleLen; w++) {
      let bestPair: [number, number] | null = null
      let bestScore = Infinity
      const prev = baseCycle[baseCycle.length - 1]

      for (const [a, b] of allPairs) {
        if (used.has(`${a}-${b}`)) continue
        if (prev && (prev.includes(a) || prev.includes(b))) continue
        const score = count[a] + count[b]
        if (score < bestScore) { bestScore = score; bestPair = [a, b] }
      }
      if (!bestPair) {
        for (const [a, b] of allPairs) {
          if (used.has(`${a}-${b}`)) continue
          const score = count[a] + count[b]
          if (score < bestScore) { bestScore = score; bestPair = [a, b] }
        }
      }
      if (!bestPair) break
      baseCycle.push(bestPair)
      used.add(`${bestPair[0]}-${bestPair[1]}`)
      count[bestPair[0]]++
      count[bestPair[1]]++
    }
  }

  const rotation: [string, string][] = []
  for (let w = 0; w < weeks; w++) {
    const pair = baseCycle[w % baseCycle.length]
    rotation.push([employeeIds[pair[0]], employeeIds[pair[1]]])
  }
  return rotation
}

// ── Shift assignment ────────────────────────────────────

function assignShift(
  matinCount: Map<string, number>,
  apremCount: Map<string, number>,
  empId: string,
): Shift {
  const m = matinCount.get(empId) ?? 0
  const a = apremCount.get(empId) ?? 0
  const shift: Shift = m <= a ? 'matin' : 'aprem'
  if (shift === 'matin') {
    matinCount.set(empId, m + 1)
  } else {
    apremCount.set(empId, a + 1)
  }
  return shift
}

// ── Main generator ──────────────────────────────────────

export function generateSchedule(options: GenerateOptions): GeneratedSchedule {
  const { employees, startDate } = options
  const cfg = options.config ?? DEFAULT_CONFIG
  const employeeIds = employees.map((e) => e.id)
  const employeeMap = new Map(employees.map((e) => [e.id, e.name]))

  const cycleLength = computeCycleLength(employees.length)
  const weeks = options.weeks ?? cycleLength

  const weekendRotation = generateWeekendRotation(employeeIds, weeks)

  const matinCount = new Map<string, number>()
  const apremCount = new Map<string, number>()

  const lastPair = weekendRotation[weeks - 1]
  let prevWeekendWorkerIds = new Set<string>(lastPair)

  const allWeeks: WeekSchedule[] = []

  // Pre-compute day sets from config
  const weekendWorkSet = new Set(cfg.weekendWorkerWorkDays)
  const weekendRestSet = new Set(cfg.weekendWorkerRestDays)

  for (let w = 0; w < weeks; w++) {
    const monday = addDays(parseDateStr(startDate), w * 7)
    const weekKey = formatDate(monday)
    const [ww1, ww2] = weekendRotation[w]
    const weekendWorkerSet = new Set([ww1, ww2])

    const recoverySet = new Set(prevWeekendWorkerIds)

    const employeeWeeks: EmployeeWeek[] = []

    for (const emp of employees) {
      const isWeekendWorker = weekendWorkerSet.has(emp.id)
      const needsRecovery = recoverySet.has(emp.id)

      const days: EmployeeDay[] = []

      for (let d = 0; d < 7; d++) {
        const date = formatDate(addDays(monday, d))
        const isWeekend = d >= 5

        if (isWeekendWorker) {
          // WEEKEND WEEK: use configured work/rest pattern
          if (weekendWorkSet.has(d)) {
            // Check recovery Monday
            if (cfg.enforceRecoveryMonday && needsRecovery && d === 0) {
              days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
            } else {
              const shift = assignShift(matinCount, apremCount, emp.id)
              const status: DayStatus = isWeekend ? 'weekend_work' : 'work'
              days.push({ date, dayIndex: d, status, shift, hours: cfg.hoursPerDay })
            }
          } else {
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          }
        } else if (needsRecovery) {
          // RECOVERY WEEK: rest Monday (if enabled) + weekend, work rest
          if (isWeekend) {
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else if (cfg.enforceRecoveryMonday && d === 0) {
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else {
            const shift = assignShift(matinCount, apremCount, emp.id)
            days.push({ date, dayIndex: d, status: 'work', shift, hours: cfg.hoursPerDay })
          }
        } else {
          // NORMAL WEEK: Mon–Fri work, Sat–Sun rest
          if (isWeekend) {
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else {
            const shift = assignShift(matinCount, apremCount, emp.id)
            days.push({ date, dayIndex: d, status: 'work', shift, hours: cfg.hoursPerDay })
          }
        }
      }

      const totalHours = days.reduce((sum, day) => sum + day.hours, 0)
      employeeWeeks.push({
        employeeId: emp.id,
        employeeName: emp.name,
        weekKey,
        days,
        totalHours,
        isWeekendWorker,
      })
    }

    allWeeks.push({ weekKey, weekendWorkerIds: [ww1, ww2], employees: employeeWeeks })

    prevWeekendWorkerIds = weekendWorkerSet
  }

  const violations = detectViolations(allWeeks, employeeMap, cfg)
  const summary = buildSummary(allWeeks, employees, weeks, matinCount, apremCount)

  return { weeks: allWeeks, violations, summary, cycleLength }
}

// ── Violation detection ─────────────────────────────────

function detectViolations(
  weeks: WeekSchedule[],
  employeeMap: Map<string, string>,
  cfg: SchedulerConfig,
): Violation[] {
  const violations: Violation[] = []

  const employeeDays = new Map<string, EmployeeDay[]>()
  for (const week of weeks) {
    for (const ew of week.employees) {
      const existing = employeeDays.get(ew.employeeId) ?? []
      existing.push(...ew.days)
      employeeDays.set(ew.employeeId, existing)
    }
  }

  for (const [empId, days] of employeeDays) {
    const empName = employeeMap.get(empId) ?? empId

    // Check max consecutive work days
    let streak = 0
    let streakStart = 0

    for (let i = 0; i < days.length; i++) {
      if (days[i].status !== 'rest') {
        if (streak === 0) streakStart = i
        streak++
        if (streak === cfg.maxConsecutiveWorkDays + 1) {
          violations.push({
            employeeId: empId,
            employeeName: empName,
            type: 'consecutive_days',
            message: `${empName} travaille ${streak}+ jours consécutifs (max ${cfg.maxConsecutiveWorkDays})`,
            dates: days.slice(streakStart, i + 1).map((d) => d.date),
          })
        }
      } else {
        streak = 0
      }
    }

    // Check min consecutive rest days per week
    for (let weekStart = 0; weekStart + 6 < days.length; weekStart += 7) {
      const weekDays = days.slice(weekStart, weekStart + 7)
      let maxConsecutiveRest = 0
      let currentRest = 0
      for (const day of weekDays) {
        if (day.status === 'rest') {
          currentRest++
          if (currentRest > maxConsecutiveRest) maxConsecutiveRest = currentRest
        } else {
          currentRest = 0
        }
      }
      if (maxConsecutiveRest < cfg.minConsecutiveRestDays) {
        violations.push({
          employeeId: empId,
          employeeName: empName,
          type: 'insufficient_consecutive_rest',
          message: `${empName} n'a pas ${cfg.minConsecutiveRestDays} jours de repos consécutifs (semaine du ${weekDays[0].date})`,
          dates: weekDays.map((d) => d.date),
        })
      }
    }
  }

  return violations
}

// ── Summary ─────────────────────────────────────────────

function buildSummary(
  weeks: WeekSchedule[],
  employees: Employee[],
  totalWeeks: number,
  matinCount: Map<string, number>,
  apremCount: Map<string, number>,
): EmployeeSummary[] {
  return employees.map((emp) => {
    let totalWeekends = 0
    let totalHours = 0
    let totalWorkDays = 0
    let totalRestDays = 0

    for (const week of weeks) {
      const ew = week.employees.find((e) => e.employeeId === emp.id)
      if (!ew) continue
      if (ew.isWeekendWorker) totalWeekends++
      totalHours += ew.totalHours
      for (const day of ew.days) {
        if (day.status === 'rest') totalRestDays++
        else totalWorkDays++
      }
    }

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      totalWeekends,
      totalHours,
      totalWorkDays,
      totalRestDays,
      avgHoursPerWeek: totalWeeks > 0 ? Math.round((totalHours / totalWeeks) * 10) / 10 : 0,
      matinCount: matinCount.get(emp.id) ?? 0,
      apremCount: apremCount.get(emp.id) ?? 0,
    }
  })
}
