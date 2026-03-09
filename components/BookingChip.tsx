'use client'

import { getOrgColor } from '@/lib/orgColors'

interface Props {
  organisation: string
  customColors?: Record<string, { color: string; bg: string }>
  onDelete: () => void
}

export function BookingChip({ organisation, customColors, onDelete }: Props) {
  const { color, bg } = getOrgColor(organisation, customColors)

  return (
    <span
      className="group relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium leading-tight max-w-full"
      style={{ backgroundColor: bg, color }}
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
