'use client'

import { useState } from 'react'
import type { Booking } from '@/server/schema'
import { BookingChip } from './BookingChip'

interface Props {
  bookings: Booking[]
  roomId: string
  dayIndex: number
  slot: number
  isToday: boolean
  isAfternoon: boolean
  isLastDayAfternoon: boolean
  customColors?: Record<string, { color: string; bg: string }>
  onClick: () => void
  onDeleteBooking: (id: string) => void
  onMoveBooking?: (bookingId: string, roomId: string, dayIndex: number, slot: number) => void
}

export function SlotCell({ bookings, roomId, dayIndex, slot, isToday, isAfternoon, isLastDayAfternoon, customColors, onClick, onDeleteBooking, onMoveBooking }: Props) {
  const [dragOver, setDragOver] = useState(false)

  const bgClass = isToday
    ? 'bg-accent/5'
    : isAfternoon
      ? 'bg-afternoon'
      : 'bg-morning'

  return (
    <div
      className={`border-b border-border ${isLastDayAfternoon ? 'border-r' : ''} ${bgClass} min-h-[40px] flex flex-col items-stretch justify-center p-0.5 gap-0.5 cursor-pointer hover:bg-accent/8 transition-colors ${
        dragOver ? 'bg-accent/15 ring-2 ring-accent/30 ring-inset' : ''
      }`}
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (onMoveBooking) {
          const bookingId = e.dataTransfer.getData('text/plain')
          if (bookingId) {
            onMoveBooking(bookingId, roomId, dayIndex, slot)
          }
        }
      }}
    >
      {bookings.map((booking) => (
        <BookingChip
          key={booking.id}
          bookingId={booking.id}
          organisation={booking.organisation}
          customColors={customColors}
          onDelete={() => onDeleteBooking(booking.id)}
        />
      ))}
    </div>
  )
}
