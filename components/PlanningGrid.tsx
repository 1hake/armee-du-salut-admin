'use client'

import { useState } from 'react'
import { parseWeekKey, getWeekDays, fmtDay, getWeekKey } from '@/lib/weekUtils'
import type { Room, Booking } from '@/server/schema'
import { SlotCell } from './SlotCell'

interface Props {
  rooms: Room[]
  bookings: Booking[]
  weekKey: string
  customColors?: Record<string, { color: string; bg: string }>
  onSlotClick: (roomId: string, dayIndex: number, slot: number) => void
  onDeleteBooking: (id: string) => void
  onMoveBooking: (bookingId: string, roomId: string, dayIndex: number, slot: number) => void
  onDeleteRoom: (id: string) => void
  onUpdateCapacity: (id: string, capacity: number | null) => void
}

const FLOORS_ORDER = ['RDC', 'R+1', 'R+2', 'R+3']

function CapacityEditor({ room, onSave }: { room: Room; onSave: (capacity: number | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(room.capacity?.toString() ?? '')

  if (editing) {
    return (
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const num = parseInt(value)
          onSave(isNaN(num) || num <= 0 ? null : num)
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const num = parseInt(value)
            onSave(isNaN(num) || num <= 0 ? null : num)
            setEditing(false)
          }
          if (e.key === 'Escape') setEditing(false)
        }}
        className="w-14 text-[10px] border border-accent/30 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-accent/20 bg-white"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setValue(room.capacity?.toString() ?? '')
        setEditing(true)
      }}
      className="text-[10px] text-muted hover:text-accent transition-colors cursor-pointer"
      title="Modifier la capacité"
    >
      {room.capacity != null ? `${room.capacity} pers.` : '+ capacité'}
    </button>
  )
}

export function PlanningGrid({ rooms, bookings, weekKey, customColors, onSlotClick, onDeleteBooking, onMoveBooking, onDeleteRoom, onUpdateCapacity }: Props) {
  const monday = parseWeekKey(weekKey)
  const days = getWeekDays(monday)
  const todayKey = getWeekKey(new Date())
  const todayDayIndex = todayKey === weekKey ? ((new Date().getDay() + 6) % 7) : -1

  // Build booking map: key -> Booking[]
  const bookingMap = new Map<string, Booking[]>()
  for (const b of bookings) {
    const key = `${b.roomId}-${b.dayIndex}-${b.slot}`
    const list = bookingMap.get(key) ?? []
    list.push(b)
    bookingMap.set(key, list)
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
  for (const [floor, floorRooms] of floorMap) {
    if (!FLOORS_ORDER.includes(floor)) {
      floorGroups.push({ floor, rooms: floorRooms })
    }
  }

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-lg bg-surface border border-border">
      <div
        className="grid min-w-[900px]"
        style={{ gridTemplateColumns: '50px minmax(160px, auto) repeat(14, 1fr)' }}
      >
        {/* Header row 1: day names */}
        <div className="col-span-2 border-b border-r border-border" />
        {days.map((day, i) => (
          <div
            key={i}
            className={`text-center text-[13px] font-medium py-2.5 border-b border-border ${
              i < 6 ? 'border-r' : ''
            } ${i === todayDayIndex ? 'bg-accent/5' : ''}`}
            style={{ gridColumn: `span 2` }}
          >
            {fmtDay(day)}
          </div>
        ))}

        {/* Header row 2: matin/aprem */}
        <div className="col-span-2 border-b border-r border-border" />
        {days.map((_, i) => (
          <div key={`slots-${i}`} className="contents">
            <div
              className={`text-center text-[10px] uppercase tracking-wider py-1.5 border-b border-border text-muted ${
                i === todayDayIndex ? 'bg-accent/5' : 'bg-morning'
              }`}
              style={{ borderRight: '1px dotted rgba(55, 53, 47, 0.25)' }}
            >
              Matin
            </div>
            <div
              className={`text-center text-[10px] uppercase tracking-wider py-1.5 border-b border-border text-muted ${
                i < 6 ? 'border-r' : ''
              } ${i === todayDayIndex ? 'bg-accent/5' : 'bg-afternoon'}`}
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
                {/* Floor label */}
                {roomIdx === 0 && (
                  <div
                    className="border-r border-b border-border flex items-center justify-center bg-bg/40"
                    style={{
                      gridRow: `span ${floorRooms.length}`,
                      writingMode: 'vertical-rl',
                    }}
                  >
                    <span className="text-[11px] font-semibold text-muted/80 rotate-180 tracking-wide">
                      {floor}
                    </span>
                  </div>
                )}

                {/* Room name */}
                <div className="group/room border-r border-b border-border px-2 sm:px-2.5 py-1.5 flex items-center gap-1">
                  <div className="min-w-0">
                    <div className="text-[12px] sm:text-[13px] font-medium whitespace-nowrap">{room.name}</div>
                    <CapacityEditor
                      room={room}
                      onSave={(capacity) => onUpdateCapacity(room.id, capacity)}
                    />
                  </div>
                  <button
                    onClick={() => onDeleteRoom(room.id)}
                    className="sm:opacity-0 sm:group-hover/room:opacity-100 transition-opacity text-muted hover:text-red-500 flex-shrink-0 ml-auto"
                    aria-label={`Supprimer ${room.name}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
                  </button>
                </div>

                {/* Slot cells: matin + aprem for each day */}
                {days.map((_, dayIndex) => {
                  const morningBookings = bookingMap.get(`${room.id}-${dayIndex}-0`) ?? []
                  const afternoonBookings = bookingMap.get(`${room.id}-${dayIndex}-1`) ?? []
                  const isLastDay = dayIndex === 6
                  return (
                    <div key={dayIndex} className="contents">
                      <SlotCell
                        bookings={morningBookings}
                        roomId={room.id}
                        dayIndex={dayIndex}
                        slot={0}
                        isToday={dayIndex === todayDayIndex}
                        isAfternoon={false}
                        isLastDayAfternoon={false}
                        isMorning={true}
                        customColors={customColors}
                        onClick={() => onSlotClick(room.id, dayIndex, 0)}
                        onDeleteBooking={onDeleteBooking}
                        onMoveBooking={onMoveBooking}
                      />
                      <SlotCell
                        bookings={afternoonBookings}
                        roomId={room.id}
                        dayIndex={dayIndex}
                        slot={1}
                        isToday={dayIndex === todayDayIndex}
                        isAfternoon={true}
                        isLastDayAfternoon={!isLastDay}
                        customColors={customColors}
                        onClick={() => onSlotClick(room.id, dayIndex, 1)}
                        onDeleteBooking={onDeleteBooking}
                        onMoveBooking={onMoveBooking}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
