import { getRooms, getBookings } from '@/server/actions'
import { getWeekKey } from '@/lib/weekUtils'
import { Providers } from './providers'
import { PlanningClient } from '@/components/PlanningClient'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const currentWeekKey = getWeekKey(new Date())
  const [rooms, bookings] = await Promise.all([
    getRooms(),
    getBookings(currentWeekKey),
  ])

  return (
    <Providers>
      <PlanningClient
        initialRooms={rooms}
        initialBookings={bookings}
        initialWeekKey={currentWeekKey}
      />
    </Providers>
  )
}
