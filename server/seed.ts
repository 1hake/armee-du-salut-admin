import { db } from './db'
import { rooms, bookings, employees } from './schema'

const SEED_ROOMS = [
  { floor: 'RDC', name: 'Cour extérieure', capacity: 50, position: 0 },
  { floor: 'RDC', name: "Salle d'accueil", capacity: 30, position: 1 },
  { floor: 'RDC', name: "Salle d'activité", capacity: 25, position: 2 },
  { floor: 'RDC', name: 'Box médical', capacity: 3, position: 3 },
  { floor: 'R+1', name: 'Bureau médiation/accueil', capacity: 6, position: 4 },
  { floor: 'R+1', name: 'Salle de réunion', capacity: 12, position: 5 },
  { floor: 'R+2', name: 'Bureau CDS / Coordo', capacity: 4, position: 6 },
  { floor: 'R+2', name: 'Bureau psy', capacity: 2, position: 7 },
]

const SEED_BOOKINGS: { roomName: string; dayIndex: number; slot: number; organisation: string }[] = [
  { roomName: "Salle d'accueil", dayIndex: 2, slot: 1, organisation: 'CRF' },
  { roomName: "Salle d'activité", dayIndex: 0, slot: 0, organisation: 'MSF' },
  { roomName: "Salle d'activité", dayIndex: 1, slot: 0, organisation: 'COMEDE' },
  { roomName: "Salle d'activité", dayIndex: 1, slot: 1, organisation: 'MSF Jur.' },
  { roomName: "Salle d'activité", dayIndex: 2, slot: 1, organisation: 'MDM' },
  { roomName: "Salle d'activité", dayIndex: 4, slot: 1, organisation: 'MSF' },
  { roomName: 'Box médical', dayIndex: 0, slot: 0, organisation: 'SSP' },
  { roomName: 'Box médical', dayIndex: 1, slot: 0, organisation: 'PM + PILAR' },
  { roomName: 'Box médical', dayIndex: 1, slot: 1, organisation: 'PM + PILAR' },
  { roomName: 'Box médical', dayIndex: 2, slot: 0, organisation: 'EMS' },
  { roomName: 'Box médical', dayIndex: 2, slot: 1, organisation: 'MDM' },
  { roomName: 'Box médical', dayIndex: 3, slot: 0, organisation: 'SSP' },
  { roomName: 'Box médical', dayIndex: 3, slot: 1, organisation: 'SSP' },
  { roomName: 'Salle de réunion', dayIndex: 2, slot: 1, organisation: '4A' },
  { roomName: 'Bureau psy', dayIndex: 1, slot: 0, organisation: 'ORTHOPHO' },
  { roomName: 'Bureau psy', dayIndex: 2, slot: 1, organisation: 'MDM' },
  { roomName: 'Bureau psy', dayIndex: 4, slot: 0, organisation: 'MDM' },
]

export async function seed() {
  const existingRooms = db.select().from(rooms).all()
  if (existingRooms.length > 0) return

  const insertedRooms = SEED_ROOMS.map((r) => {
    return db.insert(rooms).values(r).returning().get()
  })

  const roomMap = new Map(insertedRooms.map((r) => [r.name, r.id]))

  for (const b of SEED_BOOKINGS) {
    const roomId = roomMap.get(b.roomName)
    if (!roomId) continue
    db.insert(bookings).values({
      roomId,
      weekKey: '2026-04-07',
      dayIndex: b.dayIndex,
      slot: b.slot,
      organisation: b.organisation,
    }).run()
  }

  // Seed employees
  const SEED_EMPLOYEES = [
    { name: 'Alice', position: 0 },
    { name: 'Bruno', position: 1 },
    { name: 'Camille', position: 2 },
    { name: 'David', position: 3 },
    { name: 'Emma', position: 4 },
  ]
  for (const e of SEED_EMPLOYEES) {
    db.insert(employees).values(e).run()
  }
}
