import { getStats, getOrgColors, getScheduleStats } from '@/server/actions'
import { Providers } from '../providers'
import { StatsClient } from '@/components/stats/StatsClient'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const [stats, colors, scheduleStats] = await Promise.all([
    getStats(),
    getOrgColors(),
    getScheduleStats(),
  ])
  return (
    <Providers>
      <StatsClient stats={stats} customColors={colors} scheduleStats={scheduleStats} />
    </Providers>
  )
}
