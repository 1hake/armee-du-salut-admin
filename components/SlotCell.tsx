'use client'

import type { Booking } from '@/server/schema'
import { BookingChip } from './BookingChip'

interface Props {
  booking: Booking | null
  isToday: boolean
  isAfternoon: boolean
  isLastDayAfternoon: boolean
  customColors?: Record<string, { color: string; bg: string }>
  onClick: () => void
  onDelete?: () => void
}

export function SlotCell({ booking, isToday, isAfternoon, isLastDayAfternoon, customColors, onClick, onDelete }: Props) {
  const bgClass = isToday
    ? 'bg-accent/5'
    : isAfternoon
      ? 'bg-afternoon'
      : 'bg-morning'

  return (
    <div
      className={`border-b border-border/60 ${isLastDayAfternoon ? 'border-r' : ''} ${bgClass} min-h-[40px] flex items-center justify-center p-0.5 ${
        !booking ? 'cursor-pointer hover:bg-accent/8 transition-colors' : ''
      }`}
      onClick={!booking ? onClick : undefined}
    >
      {booking && onDelete && (
        <BookingChip organisation={booking.organisation} customColors={customColors} onDelete={onDelete} />
      )}
    </div>
  )
}
