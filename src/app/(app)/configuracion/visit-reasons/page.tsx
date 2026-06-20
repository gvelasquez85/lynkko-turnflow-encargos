import { redirect } from 'next/navigation'
import { getContext } from '@/lib/context'
import { visitReasons } from '@/lib/db/schema'
import { eq, asc } from '@lynkko/db'
import { VisitReasonsManager } from './VisitReasonsManager'

export const dynamic = 'force-dynamic'

export default async function VisitReasonsPage() {
  const { db, brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin'].includes(role)) redirect('/dashboard')

  const rows = await db
    .select()
    .from(visitReasons)
    .where(eq(visitReasons.brandId, brandId))
    .orderBy(asc(visitReasons.sortOrder))

  return (
    <div className="p-6 md:p-8">
      <VisitReasonsManager reasons={rows} />
    </div>
  )
}
