'use client'

import { useState } from 'react'
import type { Booking } from '@/server/schema'
import { BookingChip } from './BookingChip'

interface Props {
  booking: Booking | null
  roomId: string
  dayIndex: number
  slot: number
  isToday: boolean
  isAfternoon: boolean
  isLastDayAfternoon: boolean
  customColors?: Record<string, { color: string; bg: string }>
  onClick: () => void
  onDelete?: () => void
  onMoveBooking?: (bookingId: string, roomId: string, dayIndex: number, slot: number) => void
}

export function SlotCell({ booking, roomId, dayIndex, slot, isToday, isAfternoon, isLastDayAfternoon, customColors, onClick, onDelete, onMoveBooking }: Props) {
  const [dragOver, setDragOver] = useState(false)

  const bgClass = isToday
    ? 'bg-accent/5'
    : isAfternoon
      ? 'bg-afternoon'
      : 'bg-morning'

  return (
    <div
      className={`border-b border-border/60 ${isLastDayAfternoon ? 'border-r' : ''} ${bgClass} min-h-[40px] flex items-center justify-center p-0.5 ${
        !booking ? 'cursor-pointer hover:bg-accent/8 transition-colors' : ''
      } ${dragOver && !booking ? 'bg-accent/15 ring-2 ring-accent/30 ring-inset' : ''}`}
      onClick={!booking ? onClick : undefined}
      onDragOver={(e) => {
        if (!booking) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }
      }}
      onDragEnter={(e) => {
        if (!booking) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (!booking && onMoveBooking) {
          const bookingId = e.dataTransfer.getData('text/plain')
          if (bookingId) {
            onMoveBooking(bookingId, roomId, dayIndex, slot)
          }
        }
      }}
    >
      {booking && onDelete && (
        <BookingChip bookingId={booking.id} organisation={booking.organisation} customColors={customColors} onDelete={onDelete} />
      )}
    </div>
  )
}
