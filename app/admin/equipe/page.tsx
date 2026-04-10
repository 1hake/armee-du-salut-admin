import { requireAdmin, getUsers } from '@/server/auth'
import { getEmployees } from '@/server/equipeActions'
import { Providers } from '@/app/providers'
import { EquipeAdminClient } from '@/components/admin/EquipeAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminEquipePage() {
  await requireAdmin()
  const [userList, employees] = await Promise.all([getUsers(), getEmployees()])

  return (
    <Providers>
      <EquipeAdminClient initialUsers={userList} initialEmployees={employees} />
    </Providers>
  )
}
