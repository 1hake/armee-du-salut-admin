import { getOrganisationsList, getOrgColors, getOrgBookingCounts } from '@/server/actions'
import { Providers } from '../providers'
import { OrganisationsClient } from '@/components/organisations/OrganisationsClient'

export const dynamic = 'force-dynamic'

export default async function OrganisationsPage() {
  const [orgs, colors, counts] = await Promise.all([
    getOrganisationsList(),
    getOrgColors(),
    getOrgBookingCounts(),
  ])

  return (
    <Providers>
      <OrganisationsClient initialOrgs={orgs} customColors={colors} bookingCounts={counts} />
    </Providers>
  )
}
