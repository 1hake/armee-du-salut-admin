'use client'

import { useMemo, useState } from 'react'
import { DAYS_FR, MONTHS_FR, parseWeekKey } from '@/lib/weekUtils'
import { getOrgColor } from '@/lib/orgColors'
import type { Room, Booking, Employee, ScheduleEntry, ScheduleOverride } from '@/server/schema'

type Props = {
  stats: { bookings: Booking[]; rooms: Room[] }
  customColors: Record<string, { color: string; bg: string }>
  scheduleStats: { employees: Employee[]; entries: ScheduleEntry[]; overrides: ScheduleOverride[] }
}

// ── Tabs ────────────────────────────────────────────────
type Tab = 'salles' | 'equipe'

// ── Summary Card ────────────────────────────────────────
function SummaryCard({ icon, value, label, sub, accent }: {
  icon: React.ReactNode; value: string | number; label: string; sub?: string; accent?: string
}) {
  return (
    <div className="bg-surface rounded-lg border border-border p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent ?? 'bg-blue-50'}`}>
          {icon}
        </div>
        <div className="text-[12px] text-muted font-medium">{label}</div>
      </div>
      <div className="text-[26px] font-bold tracking-tight leading-none">{value}</div>
      {sub && <div className="text-[12px] text-muted mt-1">{sub}</div>}
    </div>
  )
}

// ── Bar Row ─────────────────────────────────────────────
function BarRow({ label, tag, count, max, color, sub }: {
  label: string; tag?: { color: string; bg: string }; count: number; max: number; color: string; sub?: string
}) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-[130px] sm:w-[170px] shrink-0 truncate">
        {tag ? (
          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ color: tag.color, backgroundColor: tag.bg }}>
            {label}
          </span>
        ) : (
          <span className="text-[13px] text-ink">{label}</span>
        )}
        {sub && <div className="text-[10px] text-muted truncate">{sub}</div>}
      </div>
      <div className="flex-1 h-5 bg-bg rounded-md overflow-hidden">
        <div
          className="h-full rounded-md transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-10 text-right text-[13px] font-semibold text-muted tabular-nums">{count}</div>
    </div>
  )
}

// ── Section Wrapper ─────────────────────────────────────
function Section({ title, subtitle, children, className }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`bg-surface rounded-lg border border-border p-5 ${className ?? ''}`}>
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Mini Donut ──────────────────────────────────────────
function Donut({ segments, size = 120 }: {
  segments: { value: number; color: string; label: string }[]; size?: number
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <p className="text-sm text-muted">Aucune donnée</p>
  const r = (size - 12) / 2
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = 14

  let cumAngle = -90
  const arcs = segments.map((seg) => {
    const angle = (seg.value / total) * 360
    const startAngle = cumAngle
    const endAngle = cumAngle + angle
    cumAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0

    return { ...seg, d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`, pct: Math.round((seg.value / total) * 100) }
  })

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={strokeWidth} strokeLinecap="round" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-[18px] font-bold fill-ink">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-[10px] fill-muted">total</text>
      </svg>
      <div className="space-y-1.5 min-w-0">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-ink font-medium">{arc.label}</span>
            <span className="text-muted ml-auto tabular-nums">{arc.value} ({arc.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Heatmap Cell ────────────────────────────────────────
function HeatCell({ value, max }: { value: number; max: number }) {
  const intensity = max > 0 ? value / max : 0
  const bg = value === 0
    ? 'bg-bg'
    : intensity > 0.75
      ? 'bg-blue-500'
      : intensity > 0.5
        ? 'bg-blue-400'
        : intensity > 0.25
          ? 'bg-blue-300'
          : 'bg-blue-200'
  const textColor = intensity > 0.5 ? 'text-white' : 'text-muted'

  return (
    <div className={`${bg} rounded-md flex items-center justify-center text-[11px] font-medium ${textColor} h-8 min-w-[36px] transition-colors`}>
      {value > 0 ? value : ''}
    </div>
  )
}

// ── Shift Badge ─────────────────────────────────────────
const SHIFT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  M: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Matin' },
  S: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Soir' },
  J: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Journée' },
  W: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Week-end' },
  R: { bg: 'bg-gray-50', text: 'text-gray-400', label: 'Repos' },
}

const SHIFT_COLORS: Record<string, string> = {
  M: '#3B82F6', S: '#F59E0B', J: '#10B981', W: '#8B5CF6', R: '#D1D5DB',
}

// ── Icons ───────────────────────────────────────────────
const IconBooking = <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2" stroke="#3B82F6" strokeWidth="1.5"/><path d="M3 8h14" stroke="#3B82F6" strokeWidth="1.5"/><path d="M7 2v4M13 2v4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/></svg>
const IconRoom = <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="11" rx="2" stroke="#8B5CF6" strokeWidth="1.5"/><path d="M6 6V4a4 4 0 018 0v2" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/></svg>
const IconOrg = <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="#10B981" strokeWidth="1.5"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/></svg>
const IconRate = <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 17V8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1z" stroke="#F59E0B" strokeWidth="1.5"/><path d="M8 18v-5h4v5" stroke="#F59E0B" strokeWidth="1.5"/></svg>
const IconEmployee = <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="#EF4444" strokeWidth="1.5"/><circle cx="14" cy="7" r="2" stroke="#EF4444" strokeWidth="1.5"/><path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 11c2 0 4 1.5 4 4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
const IconHours = <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#3B82F6" strokeWidth="1.5"/><path d="M10 6v4l3 2" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IconWeekend = <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10c0-3.3 2.7-6 6-6s6 2.7 6 6v4H4v-4z" stroke="#8B5CF6" strokeWidth="1.5"/><path d="M2 14h16v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" stroke="#8B5CF6" strokeWidth="1.5"/></svg>
const IconOverride = <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M2 10h16" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="7" stroke="#F59E0B" strokeWidth="1.5"/></svg>

// ── Main Component ──────────────────────────────────────
export function StatsClient({ stats, customColors, scheduleStats }: Props) {
  const { bookings, rooms } = stats
  const { employees, entries, overrides } = scheduleStats
  const [tab, setTab] = useState<Tab>('salles')

  // ── Room / Booking computed stats ─────────────────────
  const room = useMemo(() => {
    const totalBookings = bookings.length
    const activeRooms = rooms.length
    const orgs = [...new Set(bookings.map((b) => b.organisation))].sort()
    const orgCount = orgs.length

    // Occupancy rate
    const weekKeys = [...new Set(bookings.map((b) => b.weekKey))]
    const slotsPerWeek = activeRooms * 14
    const totalSlots = weekKeys.length * slotsPerWeek
    const occupancy = totalSlots > 0 ? Math.round((totalBookings / totalSlots) * 100) : 0

    // Org breakdown
    const orgCounts: Record<string, number> = {}
    for (const b of bookings) orgCounts[b.organisation] = (orgCounts[b.organisation] || 0) + 1
    const orgBreakdown = Object.entries(orgCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    const maxOrgCount = orgBreakdown[0]?.count ?? 0

    // Room usage
    const roomCounts: Record<string, number> = {}
    for (const b of bookings) roomCounts[b.roomId] = (roomCounts[b.roomId] || 0) + 1
    const roomBreakdown = rooms
      .map((r) => ({ room: r, count: roomCounts[r.id] || 0 }))
      .sort((a, b) => b.count - a.count)
    const maxRoomCount = roomBreakdown[0]?.count ?? 0

    // Weekly trend (last 12 weeks)
    const weekCounts: Record<string, number> = {}
    for (const b of bookings) weekCounts[b.weekKey] = (weekCounts[b.weekKey] || 0) + 1
    const sortedWeeks = Object.keys(weekCounts).sort()
    const last12 = sortedWeeks.slice(-12)
    const weeklyTrend = last12.map((wk) => {
      const d = parseWeekKey(wk)
      return { weekKey: wk, label: `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`, count: weekCounts[wk] }
    })
    const maxWeekCount = weeklyTrend.reduce((m, w) => Math.max(m, w.count), 0)

    // Day distribution
    const dayCounts = Array(7).fill(0) as number[]
    for (const b of bookings) dayCounts[b.dayIndex] += 1
    const maxDayCount = Math.max(...dayCounts, 1)

    // Slot distribution
    let morningCount = 0; let afternoonCount = 0
    for (const b of bookings) { if (b.slot === 0) morningCount++; else afternoonCount++ }

    // Heatmap: room x day
    const heatmap = rooms.map((r) => {
      const counts = Array(7).fill(0) as number[]
      for (const b of bookings) {
        if (b.roomId === r.id) counts[b.dayIndex]++
      }
      return { room: r, counts }
    })
    const heatMax = Math.max(...heatmap.flatMap((h) => h.counts), 1)

    // Floor breakdown
    const floors = [...new Set(rooms.map((r) => r.floor))]
    const floorBreakdown = floors.map((floor) => {
      const floorRooms = rooms.filter((r) => r.floor === floor)
      const count = bookings.filter((b) => floorRooms.some((r) => r.id === b.roomId)).length
      return { floor, roomCount: floorRooms.length, bookings: count }
    }).sort((a, b) => b.bookings - a.bookings)

    // Busiest day + slot combo
    const daySlotCounts: Record<string, number> = {}
    for (const b of bookings) {
      const key = `${b.dayIndex}-${b.slot}`
      daySlotCounts[key] = (daySlotCounts[key] || 0) + 1
    }
    const busiestCombo = Object.entries(daySlotCounts).sort((a, b) => b[1] - a[1])[0]
    const busiestLabel = busiestCombo
      ? `${DAYS_FR[parseInt(busiestCombo[0].split('-')[0])]} ${parseInt(busiestCombo[0].split('-')[1]) === 0 ? 'matin' : 'après-midi'}`
      : '—'

    return {
      totalBookings, activeRooms, orgCount, occupancy,
      orgBreakdown, maxOrgCount,
      roomBreakdown, maxRoomCount,
      weeklyTrend, maxWeekCount,
      dayCounts, maxDayCount,
      morningCount, afternoonCount,
      heatmap, heatMax,
      floorBreakdown,
      busiestLabel,
    }
  }, [bookings, rooms])

  // ── Employee / Schedule computed stats ────────────────
  const equipe = useMemo(() => {
    if (employees.length === 0 || entries.length === 0) return null

    const totalHours = entries.reduce((s, e) => s + e.hours, 0)
    const weekKeys = [...new Set(entries.map((e) => {
      const d = new Date(e.date + 'T00:00:00')
      const day = d.getDay()
      const offset = day === 0 ? -6 : 1 - day
      const mon = new Date(d); mon.setDate(mon.getDate() + offset)
      return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`
    }))]
    const totalWeeks = weekKeys.length

    // Shift distribution
    const shiftCounts: Record<string, number> = { M: 0, S: 0, J: 0, W: 0, R: 0 }
    for (const e of entries) {
      const code = e.shiftCode ?? (e.status === 'rest' ? 'R' : e.status === 'weekend_work' ? 'W' : 'J')
      shiftCounts[code] = (shiftCounts[code] || 0) + 1
    }

    // Per-employee stats
    const empStats = employees.map((emp) => {
      const empEntries = entries.filter((e) => e.employeeId === emp.id)
      const hours = empEntries.reduce((s, e) => s + e.hours, 0)
      const workDays = empEntries.filter((e) => e.status !== 'rest').length
      const restDays = empEntries.filter((e) => e.status === 'rest').length
      const weekends = empEntries.filter((e) => e.status === 'weekend_work').length
      const shifts: Record<string, number> = { M: 0, S: 0, J: 0, W: 0 }
      for (const e of empEntries) {
        const code = e.shiftCode ?? (e.status === 'weekend_work' ? 'W' : 'J')
        if (code in shifts) shifts[code]++
      }
      const avgHoursPerWeek = totalWeeks > 0 ? Math.round((hours / totalWeeks) * 10) / 10 : 0
      return { emp, hours, workDays, restDays, weekends, shifts, avgHoursPerWeek }
    })

    const maxHours = Math.max(...empStats.map((e) => e.hours), 1)
    const maxWeekends = Math.max(...empStats.map((e) => e.weekends), 1)

    // Overrides count
    const overridesCount = overrides.length

    return { totalHours, totalWeeks, shiftCounts, empStats, maxHours, maxWeekends, overridesCount }
  }, [employees, entries, overrides])

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-6 space-y-5">
      {/* Page title + tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold">Statistiques</h1>
        <div className="inline-flex gap-0.5">
          {([['salles', 'Salles'], ['equipe', 'Équipe']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1 text-[13px] rounded-md transition-colors ${
                tab === key ? 'bg-border text-ink font-medium' : 'text-muted hover:bg-surface-hover hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'salles' ? (
        <RoomStats computed={room} customColors={customColors} rooms={rooms} />
      ) : (
        <EquipeStats computed={equipe} employees={employees} />
      )}
    </main>
  )
}

// ── Room Stats Tab ──────────────────────────────────────
function RoomStats({ computed, customColors, rooms }: {
  computed: ReturnType<typeof Object> & any
  customColors: Record<string, { color: string; bg: string }>
  rooms: Room[]
}) {
  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={IconBooking} value={computed.totalBookings} label="Réservations" accent="bg-blue-50" />
        <SummaryCard icon={IconRoom} value={computed.activeRooms} label="Salles actives" accent="bg-violet-50" />
        <SummaryCard icon={IconOrg} value={computed.orgCount} label="Partenaires" accent="bg-emerald-50" />
        <SummaryCard icon={IconRate} value={`${computed.occupancy}%`} label="Taux d'occupation" accent="bg-amber-50" sub={`Créneau le plus chargé : ${computed.busiestLabel}`} />
      </div>

      {/* Org + Room breakdown */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Réservations par partenaire" subtitle={`${computed.orgBreakdown.length} partenaires actifs`}>
          {computed.orgBreakdown.length === 0 ? (
            <p className="text-[13px] text-muted">Aucune donnée</p>
          ) : (
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1">
              {computed.orgBreakdown.map((o: any) => {
                const c = getOrgColor(o.name, customColors)
                return <BarRow key={o.name} label={o.name} tag={c} count={o.count} max={computed.maxOrgCount} color={c.color} />
              })}
            </div>
          )}
        </Section>

        <Section title="Utilisation par salle">
          {computed.roomBreakdown.length === 0 ? (
            <p className="text-[13px] text-muted">Aucune donnée</p>
          ) : (
            <div className="space-y-0.5">
              {computed.roomBreakdown.map((r: any) => (
                <BarRow
                  key={r.room.id}
                  label={r.room.name}
                  sub={r.room.floor}
                  count={r.count}
                  max={computed.maxRoomCount}
                  color="#8B5CF6"
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Heatmap */}
      <Section title="Carte de chaleur" subtitle="Réservations par salle et par jour">
        <div className="overflow-x-auto -mx-1">
          <div className="min-w-[500px]">
            {/* Header */}
            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '130px repeat(7, 1fr)' }}>
              <div />
              {DAYS_FR.map((day) => (
                <div key={day} className="text-center text-[11px] font-medium text-muted">{day}</div>
              ))}
            </div>
            {/* Rows */}
            {computed.heatmap.map((row: any) => (
              <div key={row.room.id} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '130px repeat(7, 1fr)' }}>
                <div className="text-[11px] font-medium truncate flex items-center pr-2">{row.room.name}</div>
                {row.counts.map((c: number, i: number) => (
                  <HeatCell key={i} value={c} max={computed.heatMax} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Weekly trend */}
      <Section title="Tendance hebdomadaire" subtitle="12 dernières semaines">
        {computed.weeklyTrend.length === 0 ? (
          <p className="text-[13px] text-muted">Aucune donnée</p>
        ) : (
          <div className="flex items-end gap-1.5 h-40">
            {computed.weeklyTrend.map((w: any) => {
              const pct = computed.maxWeekCount > 0 ? (w.count / computed.maxWeekCount) * 100 : 0
              return (
                <div key={w.weekKey} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <span className="text-[11px] font-semibold text-muted tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{w.count}</span>
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full bg-blue-400 hover:bg-blue-500 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted leading-tight text-center">{w.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Day + Slot + Floor */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Section title="Par jour">
          <div className="flex items-end gap-2 h-28">
            {DAYS_FR.map((day, i) => {
              const pct = computed.maxDayCount > 0 ? (computed.dayCounts[i] / computed.maxDayCount) * 100 : 0
              const isWeekend = i >= 5
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[11px] font-semibold text-muted tabular-nums">{computed.dayCounts[i]}</span>
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${isWeekend ? 'bg-violet-400' : 'bg-blue-400'}`}
                      style={{ height: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted">{day}</span>
                </div>
              )
            })}
          </div>
        </Section>

        <Section title="Par créneau">
          <Donut
            size={100}
            segments={[
              { value: computed.morningCount, color: '#3B82F6', label: 'Matin' },
              { value: computed.afternoonCount, color: '#8B5CF6', label: 'Après-midi' },
            ]}
          />
        </Section>

        <Section title="Par étage">
          {computed.floorBreakdown.map((f: any) => (
            <div key={f.floor} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <div className="text-[13px] font-medium">{f.floor}</div>
                <div className="text-[11px] text-muted">{f.roomCount} salle{f.roomCount > 1 ? 's' : ''}</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold tabular-nums">{f.bookings}</div>
                <div className="text-[10px] text-muted">réservations</div>
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  )
}

// ── Equipe Stats Tab ────────────────────────────────────
function EquipeStats({ computed, employees }: {
  computed: any | null
  employees: Employee[]
}) {
  if (!computed) {
    return (
      <div className="rounded-lg bg-surface border border-border p-8 sm:p-16 text-center text-muted text-[15px]">
        Aucun planning enregistré. Générez et enregistrez un planning pour voir les statistiques.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={IconEmployee} value={employees.length} label="Salariés" accent="bg-red-50" />
        <SummaryCard
          icon={IconHours}
          value={`${computed.totalHours}h`}
          label="Heures totales"
          accent="bg-blue-50"
          sub={`${computed.totalWeeks} semaines planifiées`}
        />
        <SummaryCard
          icon={IconWeekend}
          value={computed.shiftCounts.W}
          label="Jours week-end"
          accent="bg-violet-50"
        />
        <SummaryCard
          icon={IconOverride}
          value={computed.overridesCount}
          label="Changements ponctuels"
          accent="bg-amber-50"
        />
      </div>

      {/* Hours per employee + Shift donut */}
      <div className="grid lg:grid-cols-[1fr_350px] gap-5">
        <Section title="Heures par salarié" subtitle="Total sur la période planifiée">
          <div className="space-y-0.5">
            {computed.empStats.map((e: any) => (
              <BarRow
                key={e.emp.id}
                label={e.emp.name}
                sub={`${e.avgHoursPerWeek}h/sem`}
                count={e.hours}
                max={computed.maxHours}
                color="#3B82F6"
              />
            ))}
          </div>
        </Section>

        <Section title="Répartition des postes">
          <Donut
            segments={[
              { value: computed.shiftCounts.M, color: SHIFT_COLORS.M, label: 'Matin' },
              { value: computed.shiftCounts.S, color: SHIFT_COLORS.S, label: 'Soir' },
              { value: computed.shiftCounts.J, color: SHIFT_COLORS.J, label: 'Journée' },
              { value: computed.shiftCounts.W, color: SHIFT_COLORS.W, label: 'Week-end' },
            ]}
          />
        </Section>
      </div>

      {/* Weekend distribution + shift breakdown per employee */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Week-ends par salarié" subtitle="Équité de la répartition">
          <div className="space-y-0.5">
            {computed.empStats.map((e: any) => (
              <BarRow
                key={e.emp.id}
                label={e.emp.name}
                count={e.weekends}
                max={computed.maxWeekends}
                color="#8B5CF6"
              />
            ))}
          </div>
        </Section>

        <Section title="Détail par salarié">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted">Nom</th>
                  {(['M', 'S', 'J', 'W'] as const).map((code) => (
                    <th key={code} className="text-center py-2 px-1.5 font-medium">
                      <span className={`inline-block px-1.5 py-0.5 rounded ${SHIFT_STYLES[code].bg} ${SHIFT_STYLES[code].text} text-[10px] font-semibold`}>
                        {code}
                      </span>
                    </th>
                  ))}
                  <th className="text-center py-2 px-2 font-medium text-muted">Travail</th>
                  <th className="text-center py-2 px-2 font-medium text-muted">Repos</th>
                </tr>
              </thead>
              <tbody>
                {computed.empStats.map((e: any) => (
                  <tr key={e.emp.id} className="border-b border-border/20 last:border-0">
                    <td className="py-2.5 px-2 font-medium">{e.emp.name}</td>
                    {(['M', 'S', 'J', 'W'] as const).map((code) => (
                      <td key={code} className="py-2.5 px-1.5 text-center tabular-nums font-medium">
                        {e.shifts[code] || <span className="text-gray-300">0</span>}
                      </td>
                    ))}
                    <td className="py-2.5 px-2 text-center tabular-nums text-emerald-600 font-medium">{e.workDays}</td>
                    <td className="py-2.5 px-2 text-center tabular-nums text-muted">{e.restDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  )
}
