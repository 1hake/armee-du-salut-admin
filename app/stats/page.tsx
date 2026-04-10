import { getStats, getOrgColors, getScheduleStats } from '@/server/actions'
import { Providers } from '../providers'
import { StatsClient } from '@/components/stats/StatsClient'
import { requireAdmin } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  await requireAdmin()
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
