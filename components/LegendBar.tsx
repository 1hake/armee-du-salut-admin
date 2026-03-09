'use client'

import { getOrgColor } from '@/lib/orgColors'

interface Props {
  organisations: string[]
  customColors?: Record<string, { color: string; bg: string }>
  onTagClick?: (org: string) => void
}

export function LegendBar({ organisations, customColors, onTagClick }: Props) {
  if (organisations.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {organisations.map((org) => {
        const { color, bg } = getOrgColor(org, customColors)
        return (
          <button
            key={org}
            type="button"
            onClick={() => onTagClick?.(org)}
            className="px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:shadow-sm transition-all active:scale-95"
            style={{ backgroundColor: bg, color }}
            title="Cliquer pour changer la couleur"
          >
            {org}
          </button>
        )
      })}
    </div>
  )
}
