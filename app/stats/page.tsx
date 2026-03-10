import { getStats, getOrgColors } from '@/server/actions'
import { Providers } from '../providers'
import { StatsClient } from '@/components/stats/StatsClient'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const [stats, colors] = await Promise.all([getStats(), getOrgColors()])
  return (
    <Providers>
      <StatsClient stats={stats} customColors={colors} />
    </Providers>
  )
}
