'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [small, setSmall] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Reduce font size if text is long
    setSmall(organisation.length > 12)
  }, [organisation])

  return (
    <span
      className={`group relative inline-flex items-start gap-0.5 px-1.5 py-0.5 rounded-full font-medium leading-tight max-w-full cursor-grab active:cursor-grabbing ${
        dragging ? 'opacity-50' : ''
      }`}
      style={{ backgroundColor: bg, color, fontSize: small ? '9px' : '11px' }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', bookingId)
        e.dataTransfer.effectAllowed = 'move'
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
    >
      <span ref={textRef} className="break-words overflow-hidden" style={{ wordBreak: 'break-word' }}>
        {organisation}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-current hover:opacity-70 flex-shrink-0 leading-none mt-px"
        aria-label={`Supprimer ${organisation}`}
      >
        &times;
      </button>
    </span>
  )
}
