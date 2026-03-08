export const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
export const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekKey(date: Date): string {
  const m = getMondayOf(date)
  const y = m.getFullYear()
  const mo = String(m.getMonth() + 1).padStart(2, '0')
  const da = String(m.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function fmtDay(d: Date): string {
  return `${DAYS_FR[((d.getDay() + 6) % 7)]} ${d.getDate()}`
}

export function fmtWeekLabel(days: Date[]): string {
  const first = days[0]
  const last = days[6]
  const f = `${first.getDate()} ${MONTHS_FR[first.getMonth()]}`
  const l = `${last.getDate()} ${MONTHS_FR[last.getMonth()]} ${last.getFullYear()}`
  return `${f} — ${l}`
}

export function parseWeekKey(weekKey: string): Date {
  const [y, m, d] = weekKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function shiftWeek(weekKey: string, delta: number): string {
  const monday = parseWeekKey(weekKey)
  monday.setDate(monday.getDate() + delta * 7)
  return getWeekKey(monday)
}
