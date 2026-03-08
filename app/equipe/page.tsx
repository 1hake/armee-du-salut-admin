import { getEmployees } from '@/server/equipeActions'
import { Providers } from '../providers'
import { EquipeClient } from '@/components/equipe/EquipeClient'

export const dynamic = 'force-dynamic'

export default async function EquipePage() {
  const employees = await getEmployees()

  return (
    <Providers>
      <EquipeClient initialEmployees={employees} />
    </Providers>
  )
}
