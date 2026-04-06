import { getEmployees } from '@/server/equipeActions'
import { Providers } from '../providers'
import { EquipeClient } from '@/components/equipe/EquipeClient'
import { requireAdmin } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function EquipePage() {
  await requireAdmin()
  const employees = await getEmployees()

  return (
    <Providers>
      <EquipeClient initialEmployees={employees} />
    </Providers>
  )
}
