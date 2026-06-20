import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import { brands, sales, customers, establishments, waTemplates, waDefaultTemplates } from '@/lib/db/schema'
import { eq, and, gte, desc, notInArray } from '@lynkko/db'
import VentasPanel from './VentasPanel'

export const dynamic = 'force-dynamic'

export default async function VentasPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { brandId, db } = await getContext()

  const since30d = new Date(Date.now() - 30 * 86400000)

  const [brand, recentSalesRaw, pendingSalesRaw, estabList, brandTemplates, defaultTemplates] = await Promise.all([
    db.select({ name: brands.name })
      .from(brands).where(eq(brands.id, brandId)).limit(1).then(r => r[0] ?? null),

    db.select({
      id:              sales.id,
      type:            sales.type,
      status:          sales.status,
      total:           sales.total,
      subtotal:        sales.subtotal,
      discount:        sales.discount,
      notes:           sales.notes,
      fulfillmentType: sales.fulfillmentType,
      sourceQuoteId:   sales.sourceQuoteId,
      createdAt:       sales.createdAt,
      establishmentId: sales.establishmentId,
      customerId:      sales.customerId,
      customerName:    customers.name,
      customerEmail:   customers.email,
      customerPhone:   customers.phone,
    })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(and(eq(sales.brandId, brandId), eq(sales.type, 'sale'), gte(sales.createdAt, since30d)))
      .orderBy(desc(sales.createdAt))
      .limit(50),

    db.select({
      id:              sales.id,
      type:            sales.type,
      status:          sales.status,
      total:           sales.total,
      subtotal:        sales.subtotal,
      discount:        sales.discount,
      notes:           sales.notes,
      fulfillmentType: sales.fulfillmentType,
      sourceQuoteId:   sales.sourceQuoteId,
      createdAt:       sales.createdAt,
      establishmentId: sales.establishmentId,
      customerId:      sales.customerId,
      customerName:    customers.name,
      customerEmail:   customers.email,
      customerPhone:   customers.phone,
    })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(and(eq(sales.brandId, brandId), eq(sales.type, 'sale'), notInArray(sales.status, ['completed', 'cancelled'])))
      .orderBy(desc(sales.createdAt)),

    db.select({ id: establishments.id, name: establishments.name })
      .from(establishments)
      .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true))),

    db.select({ category: waTemplates.category, body: waTemplates.body })
      .from(waTemplates).where(eq(waTemplates.brandId, brandId)),

    db.select({ category: waDefaultTemplates.category, body: waDefaultTemplates.body })
      .from(waDefaultTemplates),
  ])

  const defaultMap = Object.fromEntries(defaultTemplates.map(d => [d.category, d.body]))
  const brandMap   = Object.fromEntries(brandTemplates.map(t => [t.category, t.body]))
  const mergedTemplates = Object.entries({ ...defaultMap, ...brandMap }).map(([category, body]) => ({ category, body }))

  const mapSale = (s: typeof recentSalesRaw[number]) => ({
    ...s,
    total:    Number(s.total),
    subtotal: s.subtotal !== null ? Number(s.subtotal) : null,
    discount: s.discount !== null ? Number(s.discount) : null,
    createdAt: s.createdAt.toISOString(),
  })

  return (
    <VentasPanel
      brandId={brandId}
      recentSales={recentSalesRaw.map(mapSale)}
      pendingSales={pendingSalesRaw.map(mapSale)}
      establishments={estabList}
      waTemplates={mergedTemplates}
      brandName={brand?.name ?? ''}
    />
  )
}
