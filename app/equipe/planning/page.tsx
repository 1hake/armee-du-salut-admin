import { requireAuth } from '@/server/auth'
import { getSavedSchedule } from '@/server/equipeActions'
import { Providers } from '@/app/providers'
import { PlanningView } from '@/components/equipe/PlanningView'

export const dynamic = 'force-dynamic'

export default async function PlanningPage() {
  await requireAuth()
  const weeks = await getSavedSchedule()

  return (
    <Providers>
      <PlanningView initialWeeks={weeks} />
    </Providers>
  )
}
