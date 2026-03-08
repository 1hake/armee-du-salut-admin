'use client'

import type { Booking } from '@/server/schema'
import { BookingChip } from './BookingChip'

interface Props {
  booking: Booking | null
  isToday: boolean
  isAfternoon: boolean
  isLastDayAfternoon: boolean
  onClick: () => void
  onDelete?: () => void
}

export function SlotCell({ booking, isToday, isAfternoon, isLastDayAfternoon, onClick, onDelete }: Props) {
  const bgClass = isToday
    ? 'bg-blue-50/40'
    : isAfternoon
      ? 'bg-afternoon'
      : 'bg-morning'

  return (
    <div
      className={`border-b border-border ${isLastDayAfternoon ? 'border-r' : ''} ${bgClass} min-h-[40px] flex items-center justify-center p-0.5 ${
        !booking ? 'cursor-pointer hover:bg-border/30 transition-colors' : ''
      }`}
      onClick={!booking ? onClick : undefined}
    >
      {booking && onDelete && (
        <BookingChip organisation={booking.organisation} onDelete={onDelete} />
      )}
    </div>
  )
}
