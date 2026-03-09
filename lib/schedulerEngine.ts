// ── Types ───────────────────────────────────────────────

export type DayStatus = 'work' | 'rest' | 'weekend_work'
export type Shift = 'matin' | 'aprem'

export const SHIFT_LABELS: Record<Shift, { label: string; time: string }> = {
  matin: { label: 'Matin', time: '8h45 – 16h45' },
  aprem: { label: 'Après-midi', time: '10h15 – 18h15' },
}

export const HOURS_PER_DAY = 7     // 8h gross - 1h lunch (13h-14h)
export const HOURS_PER_WEEK = 35   // 5 days × 7h
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
//
// With N employees and 2 weekend workers per weekend:
// - Each employee works 2C/N weekends over C weeks
// - For integer weekends per person: C must be multiple of N (odd) or N/2 (even)
// - We also want even C for balanced matin/aprem rotation
//
// Formula: C = lcm(N, 2) when N is odd → N*2, when N is even → N

function computeCycleLength(employeeCount: number): number {
  if (employeeCount <= 2) return 2
  // Ensure each employee gets equal weekends AND equal shift distribution
  // Cycle = N for even N, 2*N for odd N (so it's always even)
  return employeeCount % 2 === 0 ? employeeCount : employeeCount * 2
}

// ── Weekend rotation ────────────────────────────────────

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
    baseCycle = [[0, 1], [2, 3], [4, 0], [1, 2], [3, 4]]
  } else {
    // Greedy approach: balanced, no back-to-back
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

// ── Rest days for weekend workers ───────────────────────
//
// Weekend worker works 5 days (3 weekdays + Sat + Sun) = 35h
// Rest days placed at Thu-Fri to avoid >6 consecutive work days
// (Mon-Wed work, Thu-Fri rest, Sat-Sun work → max 3 consecutive)

const REST_DAY_OPTIONS: [number, number][] = [
  [3, 4], // Jeu-Ven (preferred: avoids streaks)
  [0, 1], // Lun-Mar
  [1, 2], // Mar-Mer
  [2, 3], // Mer-Jeu
]

function chooseRestDays(
  restDayCount: Map<number, number>,
): [number, number] {
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

// ── Shift assignment ────────────────────────────────────
//
// Track cumulative matin/aprem per employee. Assign the shift
// that brings them closest to 50/50 balance.

function assignShift(
  matinCount: Map<string, number>,
  apremCount: Map<string, number>,
  empId: string,
): Shift {
  const m = matinCount.get(empId) ?? 0
  const a = apremCount.get(empId) ?? 0
  // Prefer matin if fewer matin days, else aprem
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
  const employeeIds = employees.map((e) => e.id)
  const employeeMap = new Map(employees.map((e) => [e.id, e.name]))

  const cycleLength = computeCycleLength(employees.length)
  const weeks = options.weeks ?? cycleLength

  const weekendRotation = generateWeekendRotation(employeeIds, weeks)

  // Shift tracking for balanced rotation
  const matinCount = new Map<string, number>()
  const apremCount = new Map<string, number>()

  const allWeeks: WeekSchedule[] = []

  for (let w = 0; w < weeks; w++) {
    const monday = addDays(parseDateStr(startDate), w * 7)
    const weekKey = formatDate(monday)
    const [ww1, ww2] = weekendRotation[w]
    const weekendWorkerSet = new Set([ww1, ww2])

    // Rest-day balancing counter for this week
    const restDayCount = new Map<number, number>()

    // Determine rest days for weekend workers
    const restDaysMap = new Map<string, [number, number]>()
    for (const empId of [ww1, ww2]) {
      const rest = chooseRestDays(restDayCount)
      restDaysMap.set(empId, rest)
      restDayCount.set(rest[0], (restDayCount.get(rest[0]) ?? 0) + 1)
      restDayCount.set(rest[1], (restDayCount.get(rest[1]) ?? 0) + 1)
    }

    // Build each employee's daily schedule
    const employeeWeeks: EmployeeWeek[] = []

    for (const emp of employees) {
      const isWeekendWorker = weekendWorkerSet.has(emp.id)
      const restDays = restDaysMap.get(emp.id)

      const days: EmployeeDay[] = []

      for (let d = 0; d < 7; d++) {
        const date = formatDate(addDays(monday, d))
        const isWeekend = d >= 5

        if (isWeekendWorker) {
          if (isWeekend) {
            const shift = assignShift(matinCount, apremCount, emp.id)
            days.push({ date, dayIndex: d, status: 'weekend_work', shift, hours: HOURS_PER_DAY })
          } else if (restDays && (d === restDays[0] || d === restDays[1])) {
            days.push({ date, dayIndex: d, status: 'rest', shift: null, hours: 0 })
          } else {
            const shift = assignShift(matinCount, apremCount, emp.id)
            days.push({ date, dayIndex: d, status: 'work', shift, hours: HOURS_PER_DAY })
          }
        } else {
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
  }

  const violations = detectViolations(allWeeks, employeeMap)
  const summary = buildSummary(allWeeks, employees, matinCount, apremCount)

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

    // Check 35h/week
    const weekHours = new Map<string, number>()
    for (const day of days) {
      const weekKey = day.date.slice(0, 10) // group by actual week
      // We need to group by the week the day belongs to
    }
  }

  // Check weekly hours
  for (const week of weeks) {
    for (const ew of week.employees) {
      if (ew.totalHours !== HOURS_PER_WEEK) {
        violations.push({
          employeeId: ew.employeeId,
          employeeName: ew.employeeName,
          type: 'hours_mismatch',
          message: `${ew.employeeName} a ${ew.totalHours}h cette semaine (attendu: ${HOURS_PER_WEEK}h)`,
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
      matinCount: matinCount.get(emp.id) ?? 0,
      apremCount: apremCount.get(emp.id) ?? 0,
    }
  })
}
