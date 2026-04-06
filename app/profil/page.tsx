import { requireAuth } from '@/server/auth'
import { getEmployeeSchedule } from '@/server/equipeActions'
import { Providers } from '@/app/providers'
import { ProfilClient } from '@/components/profil/ProfilClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const user = await requireAuth()

  if (!user.employeeId) {
    return (
      <div className="max-w-[900px] mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight mb-5 sm:mb-8">
          Mon planning
        </h1>
        <div className="rounded-xl bg-surface border border-border/60 shadow-sm p-8 sm:p-16 text-center text-muted text-[15px]">
          Votre compte n&apos;est pas lie a un salarie. Contactez un administrateur.
        </div>
      </div>
    )
  }

  const weeks = await getEmployeeSchedule(user.employeeId)

  return (
    <Providers>
      <ProfilClient weeks={weeks} employeeName={user.username} />
    </Providers>
  )
}
