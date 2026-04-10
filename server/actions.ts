'use server'

import { db } from './db'
import { rooms, bookings, organisationColors, organisations } from './schema'
import { eq, and, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// ── Rooms ──────────────────────────────────────────────
export async function getRooms() {
  return db.select().from(rooms).orderBy(rooms.position)
}

export async function addRoom(floor: string, name: string, capacity?: number) {
  const maxPos = db.select().from(rooms).all().reduce((max, r) => Math.max(max, r.position ?? 0), -1)
  await db.insert(rooms).values({ floor, name, capacity: capacity ?? null, position: maxPos + 1 })
  revalidatePath('/')
}

export async function deleteRoom(id: string) {
  await db.delete(rooms).where(eq(rooms.id, id))
  revalidatePath('/')
}

export async function updateRoom(id: string, data: { capacity?: number | null }) {
  await db.update(rooms).set(data).where(eq(rooms.id, id))
  revalidatePath('/')
}

// ── Organisations (distinct from all bookings) ─────────
export async function getOrganisations(): Promise<string[]> {
  const rows = db.select({ organisation: bookings.organisation }).from(bookings).where(ne(bookings.weekKey, '__template__')).all()
  return [...new Set(rows.map((r) => r.organisation))].sort()
}

// ── Bookings ───────────────────────────────────────────
export async function getBookings(weekKey: string) {
  return db.select().from(bookings).where(eq(bookings.weekKey, weekKey))
}

export async function addBooking(
  roomId: string, weekKey: string,
  dayIndex: number, slot: number, organisation: string
) {
  await db.insert(bookings).values({ roomId, weekKey, dayIndex, slot, organisation })
  revalidatePath('/')
}

export async function deleteBooking(id: string) {
  await db.delete(bookings).where(eq(bookings.id, id))
  revalidatePath('/')
}

export async function updateBookingComment(id: string, comment: string | null) {
  await db.update(bookings).set({ comment }).where(eq(bookings.id, id))
  revalidatePath('/')
}

// ── Organisation Colors ───────────────────────────────
export async function getOrgColors(): Promise<Record<string, { color: string; bg: string }>> {
  const rows = db.select().from(organisationColors).all()
  const map: Record<string, { color: string; bg: string }> = {}
  for (const r of rows) {
    map[r.organisation] = { color: r.color, bg: r.bg }
  }
  return map
}

export async function setOrgColor(organisation: string, color: string, bg: string) {
  const existing = db.select().from(organisationColors).where(eq(organisationColors.organisation, organisation)).all()
  if (existing.length > 0) {
    await db.update(organisationColors).set({ color, bg }).where(eq(organisationColors.organisation, organisation))
  } else {
    await db.insert(organisationColors).values({ organisation, color, bg })
  }
  revalidatePath('/')
}

export async function deleteOrgColor(organisation: string) {
  await db.delete(organisationColors).where(eq(organisationColors.organisation, organisation))
  revalidatePath('/')
}

// ── Move Booking ─────────────────────────────────────
export async function moveBooking(id: string, roomId: string, dayIndex: number, slot: number) {
  const booking = db.select().from(bookings).where(eq(bookings.id, id)).get()
  if (!booking) return false
  await db.update(bookings).set({ roomId, dayIndex, slot }).where(eq(bookings.id, id))
  revalidatePath('/')
  return true
}

// ── Stats ─────────────────────────────────────────────
export async function getStats() {
  const allBookings = db.select().from(bookings).where(ne(bookings.weekKey, '__template__')).all()
  const allRooms = db.select().from(rooms).orderBy(rooms.position).all()
  return { bookings: allBookings, rooms: allRooms }
}

export async function getScheduleStats() {
  const { employees: empTable, scheduleEntries: seTable, scheduleOverrides: soTable } = await import('./schema')
  const allEmployees = db.select().from(empTable).orderBy(empTable.position).all()
  const allEntries = db.select().from(seTable).all()
  const allOverrides = db.select().from(soTable).all()
  return { employees: allEmployees, entries: allEntries, overrides: allOverrides }
}

// ── Template Week ─────────────────────────────────────
const TEMPLATE_WEEK_KEY = '__template__'

export async function saveWeekAsTemplate(sourceWeekKey: string) {
  const sourceBookings = db.select().from(bookings).where(eq(bookings.weekKey, sourceWeekKey)).all()
  await db.delete(bookings).where(eq(bookings.weekKey, TEMPLATE_WEEK_KEY))
  for (const b of sourceBookings) {
    await db.insert(bookings).values({
      roomId: b.roomId,
      weekKey: TEMPLATE_WEEK_KEY,
      dayIndex: b.dayIndex,
      slot: b.slot,
      organisation: b.organisation,
      comment: b.comment,
    })
  }
  revalidatePath('/')
  return sourceBookings.length
}

export async function applyTemplateToWeek(targetWeekKey: string) {
  if (targetWeekKey === TEMPLATE_WEEK_KEY) return 0
  const templateBookings = db.select().from(bookings).where(eq(bookings.weekKey, TEMPLATE_WEEK_KEY)).all()
  if (templateBookings.length === 0) return 0

  await db.delete(bookings).where(eq(bookings.weekKey, targetWeekKey))
  for (const b of templateBookings) {
    await db.insert(bookings).values({
      roomId: b.roomId,
      weekKey: targetWeekKey,
      dayIndex: b.dayIndex,
      slot: b.slot,
      organisation: b.organisation,
      comment: b.comment,
    })
  }
  revalidatePath('/')
  return templateBookings.length
}

export async function hasTemplate(): Promise<boolean> {
  const row = db.select().from(bookings).where(eq(bookings.weekKey, TEMPLATE_WEEK_KEY)).get()
  return Boolean(row)
}

// ── Copy Week ─────────────────────────────────────────
export async function copyPreviousWeek(targetWeekKey: string, sourceWeekKey: string) {
  const sourceBookings = db.select().from(bookings).where(eq(bookings.weekKey, sourceWeekKey)).all()
  if (sourceBookings.length === 0) return 0

  // Delete existing bookings for the target week first
  await db.delete(bookings).where(eq(bookings.weekKey, targetWeekKey))

  for (const b of sourceBookings) {
    await db.insert(bookings).values({
      roomId: b.roomId,
      weekKey: targetWeekKey,
      dayIndex: b.dayIndex,
      slot: b.slot,
      organisation: b.organisation,
      comment: b.comment,
    })
  }
  revalidatePath('/')
  return sourceBookings.length
}

// ── Organisations Directory ──────────────────────────
export async function getOrganisationsList() {
  return db.select().from(organisations).orderBy(organisations.name)
}

export async function addOrganisation(data: { name: string; shortName?: string; contact?: string; phone?: string; email?: string; notes?: string }) {
  await db.insert(organisations).values(data)
  revalidatePath('/partenaires')
}

export async function updateOrganisation(id: string, data: { name?: string; shortName?: string; contact?: string; phone?: string; email?: string; notes?: string }) {
  // If name changed, cascade to bookings and organisation_colors
  if (data.name) {
    const existing = db.select().from(organisations).where(eq(organisations.id, id)).get()
    if (existing && existing.name !== data.name) {
      await db.update(bookings).set({ organisation: data.name }).where(eq(bookings.organisation, existing.name))
      const colorRow = db.select().from(organisationColors).where(eq(organisationColors.organisation, existing.name)).get()
      if (colorRow) {
        await db.delete(organisationColors).where(eq(organisationColors.organisation, existing.name))
        await db.insert(organisationColors).values({ organisation: data.name, color: colorRow.color, bg: colorRow.bg })
      }
    }
  }
  await db.update(organisations).set(data).where(eq(organisations.id, id))
  revalidatePath('/partenaires')
  revalidatePath('/')
}

export async function deleteOrganisation(id: string) {
  await db.delete(organisations).where(eq(organisations.id, id))
  revalidatePath('/partenaires')
}

export async function getOrgBookingCounts(): Promise<Record<string, number>> {
  const rows = db.select({ organisation: bookings.organisation }).from(bookings).where(ne(bookings.weekKey, '__template__')).all()
  const counts: Record<string, number> = {}
  for (const r of rows) {
    counts[r.organisation] = (counts[r.organisation] || 0) + 1
  }
  return counts
}
