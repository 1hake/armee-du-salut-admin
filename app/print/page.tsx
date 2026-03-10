import { getRooms, getBookings, getOrgColors } from '@/server/actions'
import { getWeekKey } from '@/lib/weekUtils'
import { PrintView } from '@/components/print/PrintView'

export const dynamic = 'force-dynamic'

export default async function PrintPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const params = await searchParams
  const weekKey = params.week || getWeekKey(new Date())
  const [rooms, bookings, colors] = await Promise.all([
    getRooms(),
    getBookings(weekKey),
    getOrgColors(),
  ])
  return <PrintView rooms={rooms} bookings={bookings} weekKey={weekKey} customColors={colors} />
}
