import { redirect, notFound } from 'next/navigation'
import { getContext } from '@/lib/context'
import { customers, establishments, brands, waTemplates } from '@/lib/db/schema'
import { and, eq } from '@lynkko/db'
import { CustomerDetailClient } from './CustomerDetailClient'

export const dynamic = 'force-dynamic'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { db, brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin', 'advisor'].includes(role))
    redirect('/app')

  const customerQuery = db.select().from(customers).where(
    role !== 'superadmin'
      ? and(eq(customers.id, id), eq(customers.brandId, brandId))
      : eq(customers.id, id)
  ).limit(1)

  const [customer] = await customerQuery

  if (!customer) notFound()

  const [estRows, brandRow, waRows] = await Promise.all([
    db.select({ id: establishments.id, name: establishments.name })
      .from(establishments)
      .where(eq(establishments.brandId, brandId)),

    db.select({ name: brands.name, activeModules: brands.activeModules, businessType: brands.businessType })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1)
      .then(r => r[0] ?? null),

    db.select({ category: waTemplates.category, body: waTemplates.body })
      .from(waTemplates)
      .where(eq(waTemplates.brandId, brandId)),
  ])

  const enriched = {
    ...customer,
    firstVisitAt: customer.firstVisitAt ?? customer.createdAt,
    lastVisitAt: customer.lastVisitAt ?? customer.createdAt,
    totalVisits: customer.totalVisits ?? 0,
    establishmentIds: customer.establishmentIds ?? [],
  }

  const businessType = brandRow?.businessType ?? 'otros'
  const brandName = brandRow?.name ?? 'Tu negocio'

  return (
    <CustomerDetailClient
      customer={enriched as any}
      establishments={estRows}
      businessType={businessType}
      waTemplates={waRows}
      brandName={brandName}
    />
  )
}
