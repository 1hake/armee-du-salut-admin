'use server'

import { db } from './db'
import { rooms, bookings, organisationColors } from './schema'
import { eq } from 'drizzle-orm'
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
  const rows = db.select({ organisation: bookings.organisation }).from(bookings).all()
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
    })
  }
  revalidatePath('/')
  return sourceBookings.length
}
