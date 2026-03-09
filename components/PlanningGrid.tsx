'use client'

import { parseWeekKey, getWeekDays, fmtDay, getWeekKey } from '@/lib/weekUtils'
import type { Room, Booking } from '@/server/schema'
import { SlotCell } from './SlotCell'

interface Props {
  rooms: Room[]
  bookings: Booking[]
  weekKey: string
  onSlotClick: (roomId: string, dayIndex: number, slot: number) => void
  onDeleteBooking: (id: string) => void
  onDeleteRoom: (id: string) => void
}

const FLOORS_ORDER = ['RDC', 'R+1', 'R+2', 'R+3']

export function PlanningGrid({ rooms, bookings, weekKey, onSlotClick, onDeleteBooking, onDeleteRoom }: Props) {
  const monday = parseWeekKey(weekKey)
  const days = getWeekDays(monday)
  const todayKey = getWeekKey(new Date())
  const todayDayIndex = todayKey === weekKey ? ((new Date().getDay() + 6) % 7) : -1

  const bookingMap = new Map<string, Booking>()
  for (const b of bookings) {
    bookingMap.set(`${b.roomId}-${b.dayIndex}-${b.slot}`, b)
  }

  // Group rooms by floor
  const floorGroups: { floor: string; rooms: Room[] }[] = []
  const floorMap = new Map<string, Room[]>()
  for (const room of rooms) {
    const list = floorMap.get(room.floor) ?? []
    list.push(room)
    floorMap.set(room.floor, list)
  }
  for (const floor of FLOORS_ORDER) {
    const floorRooms = floorMap.get(floor)
    if (floorRooms && floorRooms.length > 0) {
      floorGroups.push({ floor, rooms: floorRooms })
    }
  }
  // Add any floors not in FLOORS_ORDER
  for (const [floor, floorRooms] of floorMap) {
    if (!FLOORS_ORDER.includes(floor)) {
      floorGroups.push({ floor, rooms: floorRooms })
    }
  }

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0 border border-border rounded-lg bg-surface">
      <div
        className="grid min-w-[900px]"
        style={{ gridTemplateColumns: '50px 120px repeat(14, 1fr)' }}
      >
        {/* Header row 1: day names */}
        <div className="col-span-2 border-b border-r border-border" />
        {days.map((day, i) => (
          <div
            key={i}
            className={`col-span-2 text-center text-xs font-medium py-2 border-b border-border ${
              i < 6 ? 'border-r' : ''
            } ${i === todayDayIndex ? 'bg-blue-50/40' : ''}`}
          >
            {fmtDay(day)}
          </div>
        ))}

        {/* Header row 2: matin/aprem */}
        <div className="col-span-2 border-b border-r border-border" />
        {days.map((_, i) => (
          <div key={`slots-${i}`} className="contents">
            <div
              className={`text-center text-[10px] uppercase tracking-wider py-1 border-b border-border text-muted ${
                i === todayDayIndex ? 'bg-blue-50/40' : 'bg-morning'
              }`}
            >
              Matin
            </div>
            <div
              className={`text-center text-[10px] uppercase tracking-wider py-1 border-b border-border text-muted ${
                i < 6 ? 'border-r' : ''
              } ${i === todayDayIndex ? 'bg-blue-50/40' : 'bg-afternoon'}`}
            >
              Après-m.
            </div>
          </div>
        ))}

        {/* Room rows */}
        {floorGroups.map(({ floor, rooms: floorRooms }) => (
          <div key={floor} className="contents">
            {floorRooms.map((room, roomIdx) => (
              <div key={room.id} className="contents">
                {/* Floor label (only for first room in floor) */}
                {roomIdx === 0 && (
                  <div
                    className="border-r border-b border-border flex items-center justify-center bg-bg/50"
                    style={{
                      gridRow: `span ${floorRooms.length}`,
                      writingMode: 'vertical-rl',
                    }}
                  >
                    <span className="text-xs font-bold text-muted rotate-180">
                      {floor}
                    </span>
                  </div>
                )}

                {/* Room name */}
                <div className="group/room border-r border-b border-border px-1.5 sm:px-2 py-1 sm:py-1.5 flex items-center gap-1">
                  <div className="min-w-0">
                    <div className="text-[11px] sm:text-xs font-medium truncate">{room.name}</div>
                    {room.capacity != null && (
                      <div className="text-[10px] text-muted">{room.capacity} pers.</div>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteRoom(room.id)}
                    className="sm:opacity-0 sm:group-hover/room:opacity-100 transition-opacity text-muted hover:text-red-500 flex-shrink-0 ml-auto"
                    aria-label={`Supprimer ${room.name}`}
                  >
                    &times;
                  </button>
                </div>

                {/* 14 slot cells */}
                {days.map((_, dayIndex) => (
                  <div key={dayIndex} className="contents">
                    {[0, 1].map((slot) => {
                      const booking = bookingMap.get(`${room.id}-${dayIndex}-${slot}`)
                      const isAfternoon = slot === 1
                      const isLastDay = dayIndex === 6
                      return (
                        <SlotCell
                          key={`${dayIndex}-${slot}`}
                          booking={booking ?? null}
                          isToday={dayIndex === todayDayIndex}
                          isAfternoon={isAfternoon}
                          isLastDayAfternoon={isAfternoon && !isLastDay}
                          onClick={() => {
                            if (!booking) onSlotClick(room.id, dayIndex, slot)
                          }}
                          onDelete={booking ? () => onDeleteBooking(booking.id) : undefined}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
