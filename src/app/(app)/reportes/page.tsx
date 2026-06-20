import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import { getVerticalLabels } from '@/lib/verticals'
import { brands } from '@/lib/db/schema'
import { eq } from '@lynkko/db'
import ReportesPanel from './ReportesPanel'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { brandId, db } = await getContext()

  const [brand] = await db
    .select({ businessType: brands.businessType })
    .from(brands)
    .where(eq(brands.id, brandId))

  const labels = getVerticalLabels(brand?.businessType ?? 'default')

  return <ReportesPanel labels={labels} />
}
