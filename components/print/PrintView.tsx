'use client'

import { Fragment, useEffect } from 'react'
import { parseWeekKey, getWeekDays, fmtDay, fmtWeekLabel, DAYS_FR } from '@/lib/weekUtils'
import { getOrgColor } from '@/lib/orgColors'
import type { Room, Booking } from '@/server/schema'

const FLOORS_ORDER = ['RDC', 'R+1', 'R+2', 'R+3']

interface Props {
  rooms: Room[]
  bookings: Booking[]
  weekKey: string
  customColors: Record<string, { color: string; bg: string }>
}

export function PrintView({ rooms, bookings, weekKey, customColors }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400)
    return () => clearTimeout(timer)
  }, [])

  const monday = parseWeekKey(weekKey)
  const days = getWeekDays(monday)
  const label = fmtWeekLabel(days)

  // Build booking map (multiple per slot)
  const bookingMap = new Map<string, Booking[]>()
  for (const b of bookings) {
    const key = `${b.roomId}-${b.dayIndex}-${b.slot}`
    const list = bookingMap.get(key) ?? []
    list.push(b)
    bookingMap.set(key, list)
  }

  // Group rooms by floor
  const floorGroups: { floor: string; rooms: Room[] }[] = []
  const floorMap = new Map<string, Room[]>()
  for (const room of rooms) {
    const list = floorMap.get(room.floor) ?? []
    list.push(room)
    floorMap.set(room.floor, list)
  }
  for (const floor of FLOORS_ORDER) {
    const floorRooms = floorMap.get(floor)
    if (floorRooms && floorRooms.length > 0) {
      floorGroups.push({ floor, rooms: floorRooms })
    }
  }
  for (const [floor, floorRooms] of floorMap) {
    if (!FLOORS_ORDER.includes(floor)) {
      floorGroups.push({ floor, rooms: floorRooms })
    }
  }

  const now = new Date()
  const printDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#1D1D1F' }}>
      {/* Screen-only toolbar */}
      <div className="no-print" style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #E5E5EA' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: '#0071E3',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
          }}
        >
          Imprimer
        </button>
        <a
          href="/"
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1D1D1F',
            textDecoration: 'none',
            border: '1px solid #E5E5EA',
            borderRadius: '20px',
          }}
        >
          Retour
        </a>
      </div>

      {/* Print content */}
      <div style={{ padding: '0 24px' }} className="print-content">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '10px', paddingTop: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Plan d&apos;occupation des salles
          </div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#86868B', marginTop: '2px' }}>
            {label}
          </div>
          <div style={{ fontSize: '9px', color: '#86868B', marginTop: '2px' }}>
            Arm&eacute;e du Salut
          </div>
        </div>

        {/* Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '9px',
            lineHeight: 1.3,
          }}
        >
          <thead>
            {/* Day headers */}
            <tr>
              <th
                style={{
                  border: '1px solid #D1D1D6',
                  padding: '4px 3px',
                  backgroundColor: '#F5F5F7',
                  fontSize: '8px',
                  fontWeight: 600,
                  width: '28px',
                }}
                rowSpan={2}
              >
                &Eacute;tage
              </th>
              <th
                style={{
                  border: '1px solid #D1D1D6',
                  padding: '4px 3px',
                  backgroundColor: '#F5F5F7',
                  fontSize: '8px',
                  fontWeight: 600,
                  minWidth: '70px',
                }}
                rowSpan={2}
              >
                Salle
              </th>
              {days.map((day, i) => (
                <th
                  key={i}
                  colSpan={2}
                  style={{
                    border: '1px solid #D1D1D6',
                    padding: '4px 2px',
                    backgroundColor: '#F5F5F7',
                    fontSize: '9px',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  {fmtDay(day)}
                </th>
              ))}
            </tr>
            {/* M/A sub-headers */}
            <tr>
              {days.map((_, i) => (
                <Fragment key={i}>
                  <th
                    style={{
                      border: '1px solid #D1D1D6',
                      padding: '2px',
                      backgroundColor: '#F8FAFF',
                      fontSize: '8px',
                      fontWeight: 500,
                      textAlign: 'center',
                      color: '#86868B',
                    }}
                  >
                    M
                  </th>
                  <th
                    style={{
                      border: '1px solid #D1D1D6',
                      padding: '2px',
                      backgroundColor: '#FFFCF5',
                      fontSize: '8px',
                      fontWeight: 500,
                      textAlign: 'center',
                      color: '#86868B',
                    }}
                  >
                    A
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {floorGroups.map(({ floor, rooms: floorRooms }) =>
              floorRooms.map((room, roomIdx) => (
                <tr key={room.id}>
                  {roomIdx === 0 && (
                    <td
                      rowSpan={floorRooms.length}
                      style={{
                        border: '1px solid #D1D1D6',
                        padding: '2px 3px',
                        fontSize: '8px',
                        fontWeight: 600,
                        textAlign: 'center',
                        backgroundColor: '#FAFAFA',
                        color: '#86868B',
                        verticalAlign: 'middle',
                      }}
                    >
                      {floor}
                    </td>
                  )}
                  <td
                    style={{
                      border: '1px solid #D1D1D6',
                      padding: '3px 4px',
                      fontSize: '9px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      backgroundColor: '#FAFAFA',
                    }}
                  >
                    {room.name}
                    {room.capacity != null && (
                      <span style={{ fontSize: '7px', color: '#86868B', fontWeight: 400, marginLeft: '3px' }}>
                        ({room.capacity}p)
                      </span>
                    )}
                  </td>
                  {days.map((_, dayIndex) => (
                    <Fragment key={dayIndex}>
                      {[0, 1].map((slot) => {
                        const slotBookings = bookingMap.get(`${room.id}-${dayIndex}-${slot}`) ?? []
                        if (slotBookings.length === 0) {
                          return (
                            <td
                              key={slot}
                              style={{
                                border: '1px solid #D1D1D6',
                                padding: '2px',
                                textAlign: 'center',
                                color: '#D1D1D6',
                                fontSize: '8px',
                              }}
                            >
                              &ndash;
                            </td>
                          )
                        }
                        return (
                          <td
                            key={slot}
                            style={{
                              border: '1px solid #D1D1D6',
                              padding: '2px 3px',
                              fontSize: '8px',
                              lineHeight: 1.2,
                            }}
                          >
                            {slotBookings.map((booking) => {
                              const orgColor = getOrgColor(booking.organisation, customColors)
                              return (
                                <div key={booking.id} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      backgroundColor: orgColor.color,
                                      flexShrink: 0,
                                      printColorAdjust: 'exact',
                                      WebkitPrintColorAdjust: 'exact',
                                    }}
                                  />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60px' }}>
                                    {booking.organisation}
                                  </span>
                                </div>
                              )
                            })}
                          </td>
                        )
                      })}
                    </Fragment>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div
          style={{
            marginTop: '10px',
            fontSize: '8px',
            color: '#86868B',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Imprim&eacute; le {printDate}</span>
          <span>Arm&eacute;e du Salut &mdash; Plan d&apos;occupation</span>
        </div>
      </div>
    </div>
  )
}

