import { requireAdmin } from '@/server/auth'
import { getUsers } from '@/server/auth'
import { getEmployees } from '@/server/equipeActions'
import { Providers } from '@/app/providers'
import { UsersClient } from '@/components/admin/UsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireAdmin()
  const [userList, employees] = await Promise.all([getUsers(), getEmployees()])

  return (
    <Providers>
      <UsersClient initialUsers={userList} employees={employees} />
    </Providers>
  )
}
