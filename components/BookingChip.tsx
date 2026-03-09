'use client'

import { getOrgColor } from '@/lib/orgColors'

interface Props {
  organisation: string
  onDelete: () => void
}

export function BookingChip({ organisation, onDelete }: Props) {
  const { color, bg } = getOrgColor(organisation)

  return (
    <span
      className="group relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-[10px] font-medium leading-tight max-w-full"
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
