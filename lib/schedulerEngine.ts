// ── Types ───────────────────────────────────────────────

export type DayStatus = 'work' | 'rest' | 'weekend_work'

export interface EmployeeDay {
  date: string        // YYYY-MM-DD
  dayIndex: number    // 0=Lun … 6=Dim
  status: DayStatus
  hours: number       // 0 for rest
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
  type: 'consecutive_days' | 'hours_mismatch'
  message: string
  dates?: string[]
}

export interface GeneratedSchedule {
  weeks: WeekSchedule[]
  violations: Violation[]
  summary: EmployeeSummary[]
}

export interface EmployeeSummary {
  employeeId: string
  employeeName: string
  totalWeekends: number
  totalHours: number
  totalWorkDays: number
  totalRestDays: number
}

export interface Employee {
  id: string
  name: string
}

export interface GenerateOptions {
  employees: Employee[]
  startDate: string  // YYYY-MM-DD (must be a Monday)
  weeks: number
  weekdayHours: number  // default 7
  weekendHours: number  // default 8
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

// ── Weekend rotation ────────────────────────────────────
//
// For 5 employees, a cycle of 5 weeks where each appears exactly 2 times.
// No employee works 2 weekends in a row within a cycle.

function generateWeekendRotation(
  employeeIds: string[],
  weeks: number,
): [string, string][] {
  const n = employeeIds.length
  if (n < 2) throw new Error('Au moins 2 salariés requis')

  // All possible pairs
  const allPairs: [number, number][] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allPairs.push([i, j])
    }
  }

  let baseCycle: [number, number][]

  if (n === 5) {
    // Hand-crafted balanced rotation — no back-to-back
    baseCycle = [[0, 1], [2, 3], [4, 0], [1, 2], [3, 4]]
  } else {
    // Greedy approach for other team sizes
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
        // Avoid back-to-back
        if (prev && (prev.includes(a) || prev.includes(b))) continue
        const score = count[a] + count[b]
        if (score < bestScore) { bestScore = score; bestPair = [a, b] }
      }
      // Relax if needed
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

// ── Rest days for weekend workers ───────────────────────
//
// A weekend worker has 2 consecutive rest days during the week (Mon–Fri).
//
// KEY RULE: after working a weekend, the employee MUST rest Monday the
// following week ("post-weekend recovery") to avoid >6 consecutive days.
//
// So if the employee also has post-weekend recovery (from LAST week's
// weekend), Monday is already rest → pick Mon-Tue as the 2 rest days.
//
// Otherwise choose among [Mon-Tue, Tue-Wed, Wed-Thu, Thu-Fri] to
// balance how many people are off each day.

const REST_DAY_OPTIONS: [number, number][] = [
  [0, 1], // Lun-Mar
  [1, 2], // Mar-Mer
  [2, 3], // Mer-Jeu
  [3, 4], // Jeu-Ven
]

function chooseRestDays(
  hasPostWeekendRecovery: boolean,
  restDayCount: Map<number, number>,
): [number, number] {
  // If coming off a weekend: must include Monday rest → Mon-Tue
  if (hasPostWeekendRecovery) return [0, 1]

  // Pick the option that best balances coverage
  let bestOption = REST_DAY_OPTIONS[0]
  let bestScore = Infinity

  for (const option of REST_DAY_OPTIONS) {
    const score =
      (restDayCount.get(option[0]) ?? 0) +
      (restDayCount.get(option[1]) ?? 0)
    if (score < bestScore) {
      bestScore = score
      bestOption = option
    }
  }
  return bestOption
}

// ── Main generator ──────────────────────────────────────

export function generateSchedule(options: GenerateOptions): GeneratedSchedule {
  const { employees, startDate, weeks, weekdayHours = 7, weekendHours = 8 } = options
  const employeeIds = employees.map((e) => e.id)
  const employeeMap = new Map(employees.map((e) => [e.id, e.name]))

  const weekendRotation = generateWeekendRotation(employeeIds, weeks)

  // Track who worked the previous weekend (needs Monday recovery next week)
  let prevWeekendWorkerIds = new Set<string>()

  const allWeeks: WeekSchedule[] = []

  for (let w = 0; w < weeks; w++) {
    const monday = addDays(parseDateStr(startDate), w * 7)
    const weekKey = formatDate(monday)
    const [ww1, ww2] = weekendRotation[w]
    const weekendWorkerSet = new Set([ww1, ww2])

    // Who needs Monday recovery this week? → those who worked LAST weekend
    const needsRecovery = new Set(prevWeekendWorkerIds)

    // Rest-day balancing counter for this week
    const restDayCount = new Map<number, number>()

    // Count Monday as rest for all recovery employees
    for (const empId of needsRecovery) {
      restDayCount.set(0, (restDayCount.get(0) ?? 0) + 1)
    }

    // Determine rest days for weekend workers
    const restDaysMap = new Map<string, [number, number]>()
    for (const empId of [ww1, ww2]) {
      const hasRecovery = needsRecovery.has(empId)
      const rest = chooseRestDays(hasRecovery, restDayCount)
      restDaysMap.set(empId, rest)
      restDayCount.set(rest[0], (restDayCount.get(rest[0]) ?? 0) + 1)
      restDayCount.set(rest[1], (restDayCount.get(rest[1]) ?? 0) + 1)
    }

    // Build each employee's daily schedule
    const employeeWeeks: EmployeeWeek[] = []

    for (const emp of employees) {
      const isWeekendWorker = weekendWorkerSet.has(emp.id)
      const hasRecovery = needsRecovery.has(emp.id)
      const restDays = restDaysMap.get(emp.id)

      const days: EmployeeDay[] = []

      for (let d = 0; d < 7; d++) {
        const date = formatDate(addDays(monday, d))
        const isWeekend = d >= 5

        if (isWeekendWorker) {
          // Weekend worker: Sat+Sun work, 2 rest days in week, 3 work days in week
          if (isWeekend) {
            days.push({ date, dayIndex: d, status: 'weekend_work', hours: weekendHours })
          } else if (restDays && (d === restDays[0] || d === restDays[1])) {
            days.push({ date, dayIndex: d, status: 'rest', hours: 0 })
          } else {
            days.push({ date, dayIndex: d, status: 'work', hours: weekdayHours })
          }
        } else if (hasRecovery) {
          // Standard worker but worked last weekend → rest Monday
          if (isWeekend) {
            days.push({ date, dayIndex: d, status: 'rest', hours: 0 })
          } else if (d === 0) {
            // Monday recovery
            days.push({ date, dayIndex: d, status: 'rest', hours: 0 })
          } else {
            days.push({ date, dayIndex: d, status: 'work', hours: weekdayHours })
          }
        } else {
          // Standard worker: Mon-Fri work, Sat-Sun rest
          if (isWeekend) {
            days.push({ date, dayIndex: d, status: 'rest', hours: 0 })
          } else {
            days.push({ date, dayIndex: d, status: 'work', hours: weekdayHours })
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

    // Update for next iteration
    prevWeekendWorkerIds = weekendWorkerSet
  }

  const violations = detectViolations(allWeeks, employeeMap)
  const summary = buildSummary(allWeeks, employees)

  return { weeks: allWeeks, violations, summary }
}

// ── Violation detection ─────────────────────────────────

function detectViolations(
  weeks: WeekSchedule[],
  employeeMap: Map<string, string>,
): Violation[] {
  const violations: Violation[] = []

  // Flatten all days per employee across all weeks
  const employeeDays = new Map<string, EmployeeDay[]>()
  for (const week of weeks) {
    for (const ew of week.employees) {
      const existing = employeeDays.get(ew.employeeId) ?? []
      existing.push(...ew.days)
      employeeDays.set(ew.employeeId, existing)
    }
  }

  for (const [empId, days] of employeeDays) {
    let streak = 0
    let streakStart = 0

    for (let i = 0; i < days.length; i++) {
      if (days[i].status !== 'rest') {
        if (streak === 0) streakStart = i
        streak++
        // Only report once per streak (when it first exceeds 6)
        if (streak === 7) {
          violations.push({
            employeeId: empId,
            employeeName: employeeMap.get(empId) ?? empId,
            type: 'consecutive_days',
            message: `${employeeMap.get(empId)} travaille ${streak}+ jours consecutifs (max 6)`,
            dates: days.slice(streakStart, i + 1).map((d) => d.date),
          })
        }
      } else {
        streak = 0
      }
    }
  }

  return violations
}

// ── Summary ─────────────────────────────────────────────

function buildSummary(weeks: WeekSchedule[], employees: Employee[]): EmployeeSummary[] {
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
    }
  })
}
