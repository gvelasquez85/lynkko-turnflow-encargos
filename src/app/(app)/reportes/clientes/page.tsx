import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import { customers, establishments } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'
import { ReporteClientes } from './ReporteClientes'

export const dynamic = 'force-dynamic'

export default async function ReporteClientesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { db, brandId } = await getContext()

  const [customerRows, estRows] = await Promise.all([
    db
      .select({
        id:               customers.id,
        name:             customers.name,
        totalVisits:      customers.totalVisits,
        firstVisitAt:     customers.firstVisitAt,
        lastVisitAt:      customers.lastVisitAt,
        establishmentIds: customers.establishmentIds,
      })
      .from(customers)
      .where(eq(customers.brandId, brandId))
      .orderBy(customers.createdAt),

    db
      .select({ id: establishments.id, name: establishments.name })
      .from(establishments)
      .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true)))
      .orderBy(establishments.name),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ReporteClientes
        customers={customerRows.map(c => ({
          ...c,
          firstVisitAt: c.firstVisitAt.toISOString(),
          lastVisitAt:  c.lastVisitAt.toISOString(),
        }))}
        establishments={estRows}
      />
    </div>
  )
}
