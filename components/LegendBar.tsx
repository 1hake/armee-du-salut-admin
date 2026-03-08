'use client'

import { getOrgColor } from '@/lib/orgColors'

interface Props {
  organisations: string[]
}

export function LegendBar({ organisations }: Props) {
  if (organisations.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {organisations.map((org) => {
        const { color, bg } = getOrgColor(org)
        return (
          <span
            key={org}
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: bg, color }}
          >
            {org}
          </span>
        )
      })}
    </div>
  )
}
