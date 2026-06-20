import { redirect } from 'next/navigation'
import { getContext } from '@/lib/context'
import { brands, establishments, customers, waTemplates } from '@/lib/db/schema'
import { and, eq, desc } from '@lynkko/db'
import ClientesPageWrapper from './ClientesPageWrapper'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const ctx = await getContext().catch(() => null)
  if (!ctx) redirect('/login')

  const { brandId, db } = ctx

  const [brand] = await db
    .select({ name: brands.name, businessType: brands.businessType })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1)

  const estList = await db
    .select({ id: establishments.id, name: establishments.name })
    .from(establishments)
    .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true)))

  const initialCustomers = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      celular: customers.celular,
      email: customers.email,
      documentId: customers.documentId,
      canalContacto: customers.canalContacto,
      intereses: customers.intereses,
      cumpleanos: customers.cumpleanos,
      ultimaCompra: customers.ultimaCompra,
      firstVisitAt: customers.firstVisitAt,
      lastVisitAt: customers.lastVisitAt,
      totalVisits: customers.totalVisits,
      establishmentIds: customers.establishmentIds,
    })
    .from(customers)
    .where(eq(customers.brandId, brandId))
    .orderBy(desc(customers.lastVisitAt))
    .limit(100)

  const waTemplateList = await db
    .select({ category: waTemplates.category, body: waTemplates.body })
    .from(waTemplates)
    .where(and(eq(waTemplates.brandId, brandId), eq(waTemplates.isActive, true)))

  return (
    <ClientesPageWrapper
      brandId={brandId}
      businessType={brand?.businessType ?? 'otros'}
      brandName={brand?.name ?? 'Tu negocio'}
      customers={initialCustomers as any}
      establishments={estList}
      waTemplates={waTemplateList}
    />
  )
}
