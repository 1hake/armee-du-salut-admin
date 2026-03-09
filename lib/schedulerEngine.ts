// ── Types ───────────────────────────────────────────────

export type DayStatus = 'work' | 'rest' | 'weekend_work'
export type Shift = 'matin' | 'aprem'

export const SHIFT_LABELS: Record<Shift, { label: string; time: string }> = {
  matin: { label: 'Matin', time: '8h45 – 16h45' },
  aprem: { label: 'Après-midi', time: '10h15 – 18h15' },
}

export const HOURS_PER_DAY = 7     // 8h gross - 1h lunch (13h-14h)
export const HOURS_PER_WEEK = 35   // target average
export const LUNCH_BREAK = '13h – 14h'

export interface EmployeeDay {
  date: string        // YYYY-MM-DD
  dayIndex: number    // 0=Lun … 6=Dim
  status: DayStatus
  shift: Shift | null // null for rest
  hours: number       // 7 for work, 0 for rest
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
//
// Generates pairs of weekend workers. Ensures:
// - No employee works 2 consecutive weekends
// - Balanced distribution across the cycle

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
//
// Schedule rules:
//
// 1. WEEKEND WEEK (employee works Sat+Sun):
//    - Works Mon–Thu + Sat–Sun = 6 days × 7h = 42h
//    - Rests Friday (prevents streak within week: max 4 consecutive)
//
// 2. RECOVERY WEEK (follows a weekend week):
//    - Rests Monday (prevents cross-week streak: Sun→Tue, max 4)
//    - Works Tue–Fri = 4 days × 7h = 28h
//
// 3. NORMAL WEEK:
//    - Works Mon–Fri = 5 days × 7h = 35h
//    - Rests Sat–Sun
//
// Average: weekend(42h) + recovery(28h) = 70h / 2 weeks = 35h/week ✓
// Max consecutive work days: 4 (never exceeds 6) ✓

export function generateSchedule(options: GenerateOptions): GeneratedSchedule {
  const { employees, startDate } = options
  const employeeIds = employees.map((e) => e.id)
  const employeeMap = new Map(employees.map((e) => [e.id, e.name]))

  const cycleLength = computeCycleLength(employees.length)
  const weeks = options.weeks ?? cycleLength

  const weekendRotation = generateWeekendRotation(employeeIds, weeks)

  // Shift tracking for balanced rotation
  const matinCount = new Map<string, number>()
  const apremCount = new Map<string, number>()

  // Pre-initialize with the LAST week's weekend pair to simulate cycle wrap-around.
  // This ensures employees who work the last weekend get recovery in week 1.
  const lastPair = weekendRotation[weeks - 1]
  let prevWeekendWorkerIds = new Set<string>(lastPair)

  const allWeeks: WeekSchedule[] = []

  for (let w = 0; w < weeks; w++) {
    const monday = addDays(parseDateStr(startDate), w * 7)
    const weekKey = formatDate(monday)
    const [ww1, ww2] = weekendRotation[w]
    const weekendWorkerSet = new Set([ww1, ww2])

    // Recovery: employees who worked LAST weekend rest Monday this week
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
          // WEEKEND WEEK: work Mon–Thu + Sat–Sun, rest Friday
          if (isWeekend) {
            const shift = assignShift(matinCount, apremCount, emp.id)
            days.push({ date, dayIndex: d, status: 'weekend_work', shift, hours: HOURS_PER_DAY })
          } else if (d === 4) {
            // Friday = rest
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else if (needsRecovery && d === 0) {
            // Also rest Monday if recovering from last weekend
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else {
            const shift = assignShift(matinCount, apremCount, emp.id)
            days.push({ date, dayIndex: d, status: 'work', shift, hours: HOURS_PER_DAY })
          }
        } else if (needsRecovery) {
          // RECOVERY WEEK: rest Monday, work Tue–Fri, rest Sat–Sun
          if (isWeekend) {
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else if (d === 0) {
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else {
            const shift = assignShift(matinCount, apremCount, emp.id)
            days.push({ date, dayIndex: d, status: 'work', shift, hours: HOURS_PER_DAY })
          }
        } else {
          // NORMAL WEEK: Mon–Fri work, Sat–Sun rest
          if (isWeekend) {
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else {
            const shift = assignShift(matinCount, apremCount, emp.id)
            days.push({ date, dayIndex: d, status: 'work', shift, hours: HOURS_PER_DAY })
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
  const summary = buildSummary(allWeeks, employees, weeks, matinCount, apremCount)

  return { weeks: allWeeks, violations, summary, cycleLength }
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
