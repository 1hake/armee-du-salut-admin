import * as XLSX from 'xlsx'
import type { Room, Booking } from '@/server/schema'
import { DAYS_FR, parseWeekKey, getWeekDays, fmtWeekLabel } from './weekUtils'

const FLOORS_ORDER = ['RDC', 'R+1', 'R+2', 'R+3']

export function exportPlanningToExcel(
  rooms: Room[],
  bookings: Booking[],
  weekKey: string
) {
  const monday = parseWeekKey(weekKey)
  const days = getWeekDays(monday)
  const label = fmtWeekLabel(days)

  // Build booking lookup
  const bookingMap = new Map<string, Booking>()
  for (const b of bookings) {
    bookingMap.set(`${b.roomId}-${b.dayIndex}-${b.slot}`, b)
  }

  // Sort rooms by floor
  const sortedRooms: { floor: string; room: Room }[] = []
  const floorMap = new Map<string, Room[]>()
  for (const room of rooms) {
    const list = floorMap.get(room.floor) ?? []
    list.push(room)
    floorMap.set(room.floor, list)
  }
  for (const floor of FLOORS_ORDER) {
    const floorRooms = floorMap.get(floor)
    if (floorRooms) {
      for (const room of floorRooms) sortedRooms.push({ floor, room })
    }
  }
  for (const [floor, floorRooms] of floorMap) {
    if (!FLOORS_ORDER.includes(floor)) {
      for (const room of floorRooms) sortedRooms.push({ floor, room })
    }
  }

  // Build worksheet data
  const header1 = ['Étage', 'Salle']
  const header2 = ['', '']
  for (let i = 0; i < 7; i++) {
    const day = days[i]
    const dayLabel = `${DAYS_FR[i]} ${day.getDate()}/${day.getMonth() + 1}`
    header1.push(dayLabel, '')
    header2.push('Matin', 'Après-midi')
  }

  const data: string[][] = [header1, header2]

  for (const { floor, room } of sortedRooms) {
    const row: string[] = [floor, room.name]
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      for (let slot = 0; slot < 2; slot++) {
        const booking = bookingMap.get(`${room.id}-${dayIndex}-${slot}`)
        row.push(booking ? booking.organisation : '')
      }
    }
    data.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet(data)

  // Merge day header cells (each day spans 2 columns)
  ws['!merges'] = []
  for (let i = 0; i < 7; i++) {
    ws['!merges'].push({ s: { r: 0, c: 2 + i * 2 }, e: { r: 0, c: 3 + i * 2 } })
  }

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Étage
    { wch: 18 }, // Salle
    ...Array(14).fill({ wch: 14 }),
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Planning')
  XLSX.writeFile(wb, `planning-${weekKey}.xlsx`)
}
