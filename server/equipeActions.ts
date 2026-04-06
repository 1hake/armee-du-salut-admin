'use server'

import { db } from './db'
import { employees, scheduleEntries, scheduleOverrides } from './schema'
import { eq, and, gte, lte, desc, asc, min, max } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  generateSchedule,
  type GeneratedSchedule,
  type Employee as EngineEmployee,
} from '@/lib/schedulerEngine'

// ── Employees ──────────────────────────────────────────

export async function getEmployees() {
  return db.select().from(employees).orderBy(employees.position)
}

export async function addEmployee(name: string) {
  const maxPos = db.select().from(employees).all()
    .reduce((max, e) => Math.max(max, e.position ?? 0), -1)
  await db.insert(employees).values({ name, position: maxPos + 1 })
  revalidatePath('/equipe')
}

export async function renameEmployee(id: string, name: string) {
  await db.update(employees).set({ name }).where(eq(employees.id, id))
  revalidatePath('/equipe')
}

export async function deleteEmployee(id: string) {
  await db.delete(employees).where(eq(employees.id, id))
  revalidatePath('/equipe')
}

// ── Schedule entries ───────────────────────────────────

export async function getScheduleEntries(startDate: string, endDate: string) {
  return db.select().from(scheduleEntries)
    .where(and(
      gte(scheduleEntries.date, startDate),
      lte(scheduleEntries.date, endDate),
    ))
    .orderBy(scheduleEntries.date)
}

export async function generateSchedulePreview(
  startDate: string,
  cycles?: number,
): Promise<GeneratedSchedule> {
  const emps = db.select().from(employees).orderBy(employees.position).all()
  if (emps.length !== 5) throw new Error('Exactement 5 salariés requis')

  const engineEmployees: EngineEmployee[] = emps.map((e) => ({ id: e.id, name: e.name }))

  return generateSchedule({
    employees: engineEmployees,
    startDate,
    cycles,
  })
}

export async function saveSchedule(schedule: GeneratedSchedule): Promise<void> {
  if (schedule.weeks.length === 0) return

  const firstDate = schedule.weeks[0].weekKey
  const lastWeek = schedule.weeks[schedule.weeks.length - 1]
  const lastDay = lastWeek.employees[0]?.days[lastWeek.employees[0].days.length - 1]
  const endDateStr = lastDay?.date ?? firstDate

  // Delete existing entries in the date range
  await db.delete(scheduleEntries).where(
    and(
      gte(scheduleEntries.date, firstDate),
      lte(scheduleEntries.date, endDateStr),
    )
  )

  // Insert new entries
  for (const week of schedule.weeks) {
    for (const empWeek of week.employees) {
      for (const day of empWeek.days) {
        db.insert(scheduleEntries).values({
          employeeId: empWeek.employeeId,
          date: day.date,
          dayIndex: day.dayIndex,
          status: day.status,
          hours: day.hours,
          shiftCode: day.shiftCode,
        }).run()
      }
    }
  }

  revalidatePath('/equipe')
  revalidatePath('/equipe/planning')
  revalidatePath('/profil')
}

// ── Schedule Overrides (changements ponctuels) ────────

export async function getScheduleOverrides() {
  return db.select().from(scheduleOverrides).orderBy(desc(scheduleOverrides.date))
}

export async function addScheduleOverride(employeeId: string, date: string, description: string) {
  await db.insert(scheduleOverrides).values({ employeeId, date, description })
  revalidatePath('/equipe')
}

export async function deleteScheduleOverride(id: string) {
  await db.delete(scheduleOverrides).where(eq(scheduleOverrides.id, id))
  revalidatePath('/equipe')
}

export interface SavedWeek {
  weekKey: string
  employees: {
    employeeId: string
    employeeName: string
    days: {
      date: string
      dayIndex: number
      status: string
      hours: number
      shiftCode: string | null
    }[]
  }[]
}

export async function getSavedSchedule(): Promise<SavedWeek[]> {
  const entries = db.select().from(scheduleEntries)
    .innerJoin(employees, eq(scheduleEntries.employeeId, employees.id))
    .orderBy(asc(scheduleEntries.date), asc(employees.position))
    .all()

  if (entries.length === 0) return []

  // Group by week (Monday)
  const weekMap = new Map<string, Map<string, { employeeName: string; days: SavedWeek['employees'][0]['days'] }>>()

  for (const row of entries) {
    const d = new Date(row.schedule_entries.date + 'T00:00:00')
    const dayOfWeek = d.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(d)
    monday.setDate(monday.getDate() + mondayOffset)
    const weekKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`

    if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map())
    const empMap = weekMap.get(weekKey)!

    const empId = row.schedule_entries.employeeId
    if (!empMap.has(empId)) {
      empMap.set(empId, { employeeName: row.employees.name, days: [] })
    }
    empMap.get(empId)!.days.push({
      date: row.schedule_entries.date,
      dayIndex: row.schedule_entries.dayIndex,
      status: row.schedule_entries.status,
      hours: row.schedule_entries.hours,
      shiftCode: row.schedule_entries.shiftCode,
    })
  }

  const weeks: SavedWeek[] = []
  for (const [weekKey, empMap] of Array.from(weekMap.entries()).sort()) {
    const emps = Array.from(empMap.entries()).map(([employeeId, data]) => ({
      employeeId,
      employeeName: data.employeeName,
      days: data.days.sort((a, b) => a.dayIndex - b.dayIndex),
    }))
    weeks.push({ weekKey, employees: emps })
  }

  return weeks
}

export async function getEmployeeSchedule(employeeId: string): Promise<SavedWeek[]> {
  const entries = db.select().from(scheduleEntries)
    .innerJoin(employees, eq(scheduleEntries.employeeId, employees.id))
    .where(eq(scheduleEntries.employeeId, employeeId))
    .orderBy(asc(scheduleEntries.date))
    .all()

  if (entries.length === 0) return []

  const weekMap = new Map<string, SavedWeek['employees'][0]['days']>()
  let employeeName = ''

  for (const row of entries) {
    employeeName = row.employees.name
    const d = new Date(row.schedule_entries.date + 'T00:00:00')
    const dayOfWeek = d.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(d)
    monday.setDate(monday.getDate() + mondayOffset)
    const weekKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`

    if (!weekMap.has(weekKey)) weekMap.set(weekKey, [])
    weekMap.get(weekKey)!.push({
      date: row.schedule_entries.date,
      dayIndex: row.schedule_entries.dayIndex,
      status: row.schedule_entries.status,
      hours: row.schedule_entries.hours,
      shiftCode: row.schedule_entries.shiftCode,
    })
  }

  const weeks: SavedWeek[] = []
  for (const [weekKey, days] of Array.from(weekMap.entries()).sort()) {
    weeks.push({
      weekKey,
      employees: [{
        employeeId,
        employeeName,
        days: days.sort((a, b) => a.dayIndex - b.dayIndex),
      }],
    })
  }

  return weeks
}

export async function clearSchedule(startDate: string, endDate: string) {
  await db.delete(scheduleEntries).where(
    and(
      gte(scheduleEntries.date, startDate),
      lte(scheduleEntries.date, endDate),
    )
  )
  revalidatePath('/equipe')
}
