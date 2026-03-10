'use client'

import { useMemo } from 'react'
import { DAYS_FR, MONTHS_FR, parseWeekKey } from '@/lib/weekUtils'
import { getOrgColor } from '@/lib/orgColors'
import type { Room, Booking } from '@/server/schema'

type Props = {
  stats: { bookings: Booking[]; rooms: Room[] }
  customColors: Record<string, { color: string; bg: string }>
}

// ── Summary Card ────────────────────────────────────────
function SummaryCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border/60 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-sm text-muted">{label}</div>
      </div>
    </div>
  )
}

// ── Bar Row ─────────────────────────────────────────────
function BarRow({ label, tag, count, max, color }: {
  label: string; tag?: { color: string; bg: string }; count: number; max: number; color: string
}) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-[140px] sm:w-[180px] shrink-0 truncate text-sm">
        {tag ? (
          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium" style={{ color: tag.color, backgroundColor: tag.bg }}>
            {label}
          </span>
        ) : (
          <span className="text-ink">{label}</span>
        )}
      </div>
      <div className="flex-1 h-6 bg-bg rounded-md overflow-hidden">
        <div
          className="h-full rounded-md transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-10 text-right text-sm font-medium text-muted tabular-nums">{count}</div>
    </div>
  )
}

// ── Section Wrapper ─────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border/60 p-5">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </div>
  )
}

// ── Icons (simple SVG) ──────────────────────────────────
const IconBooking = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2" stroke="#0071E3" strokeWidth="1.5"/><path d="M3 8h14" stroke="#0071E3" strokeWidth="1.5"/><path d="M7 2v4M13 2v4" stroke="#0071E3" strokeWidth="1.5" strokeLinecap="round"/></svg>
)
const IconRoom = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="11" rx="2" stroke="#0071E3" strokeWidth="1.5"/><path d="M6 6V4a4 4 0 018 0v2" stroke="#0071E3" strokeWidth="1.5" strokeLinecap="round"/></svg>
)
const IconOrg = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="#0071E3" strokeWidth="1.5"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#0071E3" strokeWidth="1.5" strokeLinecap="round"/></svg>
)
const IconRate = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17V8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1z" stroke="#0071E3" strokeWidth="1.5"/><path d="M8 18v-5h4v5" stroke="#0071E3" strokeWidth="1.5"/></svg>
)

// ── Main Component ──────────────────────────────────────
export function StatsClient({ stats, customColors }: Props) {
  const { bookings, rooms } = stats

  const computed = useMemo(() => {
    const totalBookings = bookings.length
    const activeRooms = rooms.length
    const orgs = [...new Set(bookings.map((b) => b.organisation))].sort()
    const orgCount = orgs.length

    // Occupancy rate
    const weekKeys = [...new Set(bookings.map((b) => b.weekKey))]
    const slotsPerWeek = activeRooms * 14 // 7 days * 2 slots
    const totalSlots = weekKeys.length * slotsPerWeek
    const occupancy = totalSlots > 0 ? Math.round((totalBookings / totalSlots) * 100) : 0

    // Org breakdown
    const orgCounts: Record<string, number> = {}
    for (const b of bookings) {
      orgCounts[b.organisation] = (orgCounts[b.organisation] || 0) + 1
    }
    const orgBreakdown = Object.entries(orgCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    const maxOrgCount = orgBreakdown.length > 0 ? orgBreakdown[0].count : 0

    // Room usage
    const roomMap = new Map(rooms.map((r) => [r.id, r]))
    const roomCounts: Record<string, number> = {}
    for (const b of bookings) {
      roomCounts[b.roomId] = (roomCounts[b.roomId] || 0) + 1
    }
    const roomBreakdown = rooms
      .map((r) => ({ room: r, count: roomCounts[r.id] || 0 }))
      .sort((a, b) => b.count - a.count)
    const maxRoomCount = roomBreakdown.length > 0 ? roomBreakdown[0].count : 0

    // Weekly trend (last 12 weeks)
    const weekCounts: Record<string, number> = {}
    for (const b of bookings) {
      weekCounts[b.weekKey] = (weekCounts[b.weekKey] || 0) + 1
    }
    const sortedWeeks = Object.keys(weekCounts).sort()
    const last12 = sortedWeeks.slice(-12)
    const weeklyTrend = last12.map((wk) => {
      const d = parseWeekKey(wk)
      const label = `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
      return { weekKey: wk, label, count: weekCounts[wk] }
    })
    const maxWeekCount = weeklyTrend.reduce((m, w) => Math.max(m, w.count), 0)

    // Day distribution
    const dayCounts = Array(7).fill(0) as number[]
    for (const b of bookings) {
      dayCounts[b.dayIndex] += 1
    }
    const maxDayCount = Math.max(...dayCounts, 1)

    // Slot distribution
    let morningCount = 0
    let afternoonCount = 0
    for (const b of bookings) {
      if (b.slot === 0) morningCount++
      else afternoonCount++
    }

    return {
      totalBookings, activeRooms, orgCount, occupancy,
      orgBreakdown, maxOrgCount,
      roomBreakdown, maxRoomCount,
      weeklyTrend, maxWeekCount,
      dayCounts, maxDayCount,
      morningCount, afternoonCount,
    }
  }, [bookings, rooms])

  return (
    <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={IconBooking} value={computed.totalBookings} label="Reservations" />
        <SummaryCard icon={IconRoom} value={computed.activeRooms} label="Salles" />
        <SummaryCard icon={IconOrg} value={computed.orgCount} label="Partenaires" />
        <SummaryCard icon={IconRate} value={`${computed.occupancy}%`} label="Taux d'occupation" />
      </div>

      {/* Two column layout for org + room */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Org breakdown */}
        <Section title="Reservations par partenaire">
          {computed.orgBreakdown.length === 0 ? (
            <p className="text-sm text-muted">Aucune donnee</p>
          ) : (
            <div className="space-y-0.5">
              {computed.orgBreakdown.map((o) => {
                const c = getOrgColor(o.name, customColors)
                return (
                  <BarRow
                    key={o.name}
                    label={o.name}
                    tag={c}
                    count={o.count}
                    max={computed.maxOrgCount}
                    color={c.color}
                  />
                )
              })}
            </div>
          )}
        </Section>

        {/* Room usage */}
        <Section title="Utilisation par salle">
          {computed.roomBreakdown.length === 0 ? (
            <p className="text-sm text-muted">Aucune donnee</p>
          ) : (
            <div className="space-y-0.5">
              {computed.roomBreakdown.map((r) => (
                <BarRow
                  key={r.room.id}
                  label={`${r.room.name} (${r.room.floor})`}
                  count={r.count}
                  max={computed.maxRoomCount}
                  color="#0071E3"
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Weekly trend */}
      <Section title="Tendance hebdomadaire (12 dernieres semaines)">
        {computed.weeklyTrend.length === 0 ? (
          <p className="text-sm text-muted">Aucune donnee</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {computed.weeklyTrend.map((w) => {
              const pct = computed.maxWeekCount > 0 ? (w.count / computed.maxWeekCount) * 100 : 0
              return (
                <div key={w.weekKey} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-xs font-medium text-muted tabular-nums">{w.count}</span>
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full bg-accent rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted leading-tight text-center">{w.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Day + Slot row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Day distribution */}
        <Section title="Repartition par jour">
          <div className="flex items-end gap-3 h-32">
            {DAYS_FR.map((day, i) => {
              const pct = computed.maxDayCount > 0 ? (computed.dayCounts[i] / computed.maxDayCount) * 100 : 0
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-xs font-medium text-muted tabular-nums">{computed.dayCounts[i]}</span>
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full bg-accent rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{day}</span>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Slot distribution */}
        <Section title="Repartition par creneau">
          <div className="space-y-4 pt-2">
            {(() => {
              const maxSlot = Math.max(computed.morningCount, computed.afternoonCount, 1)
              return (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">Matin</span>
                      <span className="text-sm text-muted tabular-nums">{computed.morningCount}</span>
                    </div>
                    <div className="h-8 bg-bg rounded-md overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-md transition-all duration-300"
                        style={{ width: `${(computed.morningCount / maxSlot) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">Apres-midi</span>
                      <span className="text-sm text-muted tabular-nums">{computed.afternoonCount}</span>
                    </div>
                    <div className="h-8 bg-bg rounded-md overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-md transition-all duration-300"
                        style={{ width: `${(computed.afternoonCount / maxSlot) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </Section>
      </div>
    </main>
  )
}
