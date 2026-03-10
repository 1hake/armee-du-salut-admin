'use server'

import { db } from './db'
import { employees, scheduleEntries, schedulerConfig } from './schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  generateSchedule,
  DEFAULT_CONFIG,
  type GeneratedSchedule,
  type Employee as EngineEmployee,
  type SchedulerConfig,
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

export async function deleteEmployee(id: string) {
  await db.delete(employees).where(eq(employees.id, id))
  revalidatePath('/equipe')
}

// ── Scheduler Config ───────────────────────────────────

export async function getSchedulerConfig(): Promise<SchedulerConfig> {
  const row = db.select().from(schedulerConfig).where(eq(schedulerConfig.id, 'default')).get()
  if (!row) return DEFAULT_CONFIG
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(row.config) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export async function saveSchedulerConfig(config: SchedulerConfig): Promise<void> {
  const existing = db.select().from(schedulerConfig).where(eq(schedulerConfig.id, 'default')).get()
  if (existing) {
    await db.update(schedulerConfig)
      .set({ config: JSON.stringify(config) })
      .where(eq(schedulerConfig.id, 'default'))
  } else {
    await db.insert(schedulerConfig).values({ id: 'default', config: JSON.stringify(config) })
  }
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

export async function generateAndSaveSchedule(
  startDate: string,
  weeks?: number,
): Promise<GeneratedSchedule> {
  const emps = db.select().from(employees).orderBy(employees.position).all()
  if (emps.length < 2) throw new Error('Au moins 2 salariés requis')

  const config = await getSchedulerConfig()
  const engineEmployees: EngineEmployee[] = emps.map((e) => ({ id: e.id, name: e.name }))

  const schedule = generateSchedule({
    employees: engineEmployees,
    startDate,
    weeks,
    config,
  })

  // Compute date range to clear
  const actualWeeks = schedule.weeks.length
  const endD = new Date(startDate)
  endD.setDate(endD.getDate() + actualWeeks * 7 - 1)
  const endDateStr = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`

  // Delete existing entries in the date range
  await db.delete(scheduleEntries).where(
    and(
      gte(scheduleEntries.date, startDate),
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
        }).run()
      }
    }
  }

  revalidatePath('/equipe')
  return schedule
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
