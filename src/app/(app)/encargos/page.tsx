import { redirect } from 'next/navigation'
import { getContext } from '@/lib/context'
import { encargos, encargoServices, customers, users, products } from '@/lib/db/schema'
import { eq, and, inArray, desc } from '@lynkko/db'
import { EncargosHub } from './EncargosHub'

export const dynamic = 'force-dynamic'

export default async function EncargosPage() {
  const { db, brandId } = await getContext()

  const [services, encargoRows, customerRows, advisorRows, productRows] = await Promise.all([
    db.select().from(encargoServices)
      .where(eq(encargoServices.brandId, brandId))
      .orderBy(encargoServices.sortOrder),

    db.select().from(encargos)
      .where(eq(encargos.brandId, brandId))
      .orderBy(desc(encargos.receivedAt))
      .limit(300),

    db.select({ id: customers.id, name: customers.name, phone: customers.phone, celular: customers.celular, email: customers.email })
      .from(customers)
      .where(eq(customers.brandId, brandId))
      .orderBy(customers.name)
      .limit(500),

    db.select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.brandId, brandId), inArray(users.role, ['advisor', 'brand_admin', 'manager']))),

    db.select({ id: products.id, name: products.name, price: products.price, productType: products.productType })
      .from(products)
      .where(and(eq(products.brandId, brandId), eq(products.active, true)))
      .orderBy(products.name)
      .limit(200),
  ])

  const customerMap = Object.fromEntries(customerRows.map(c => [c.id, c]))
  const advisorMap  = Object.fromEntries(advisorRows.map(a => [a.id, a]))
  const serviceMap  = Object.fromEntries(services.map(s => [s.id, s]))

  const encargosMapped = encargoRows.map(e => ({
    ...e,
    price:           Number(e.price ?? 0),
    receivedAt:      e.receivedAt?.toISOString() ?? null,
    deliveredAt:     e.deliveredAt?.toISOString() ?? null,
    readyAt:         e.readyAt?.toISOString() ?? null,
    notifiedAt:      e.notifiedAt?.toISOString() ?? null,
    createdAt:       e.createdAt?.toISOString() ?? null,
    updatedAt:       e.updatedAt?.toISOString() ?? null,
    customerName:    e.customerId ? (customerMap[e.customerId]?.name ?? null) : null,
    customerPhone:   e.customerId ? (customerMap[e.customerId]?.phone ?? null) : null,
    customerCelular: e.customerId ? (customerMap[e.customerId]?.celular ?? null) : null,
    advisorName:     e.advisorId  ? (advisorMap[e.advisorId]?.name ?? null)   : null,
    serviceName:     e.serviceId  ? (serviceMap[e.serviceId]?.name ?? null)   : null,
  }))

  return (
    <EncargosHub
      brandId={brandId}
      services={services.map(s => ({ ...s, price: Number(s.price ?? 0) }))}
      encargos={encargosMapped as any}
      customers={customerRows}
      advisors={advisorRows}
      catalogProducts={productRows.map(p => ({ ...p, price: Number(p.price ?? 0) }))}
    />
  )
}
