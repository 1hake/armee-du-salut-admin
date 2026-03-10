'use client'

import { useState } from 'react'
import { getOrgColor } from '@/lib/orgColors'

interface Props {
  bookingId: string
  organisation: string
  customColors?: Record<string, { color: string; bg: string }>
  onDelete: () => void
}

export function BookingChip({ bookingId, organisation, customColors, onDelete }: Props) {
  const { color, bg } = getOrgColor(organisation, customColors)
  const [dragging, setDragging] = useState(false)

  return (
    <span
      className={`group relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium leading-tight max-w-full cursor-grab active:cursor-grabbing ${
        dragging ? 'opacity-50' : ''
      }`}
      style={{ backgroundColor: bg, color }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', bookingId)
        e.dataTransfer.effectAllowed = 'move'
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
    >
      <span className="truncate">{organisation}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-current hover:opacity-70 flex-shrink-0"
        aria-label={`Supprimer ${organisation}`}
      >
        &times;
      </button>
    </span>
  )
}
