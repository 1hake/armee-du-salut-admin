import { getSession } from '@/server/auth'
import { Nav } from './Nav'

export async function NavWrapper() {
  const session = await getSession()
  if (!session) return null

  return <Nav role={session.role} username={session.username} />
}
