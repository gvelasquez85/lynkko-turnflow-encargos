import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargos, encargoItems, customers, users, encargoServices } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

type Params = { params: Promise<{ id: string }> }

async function fetchEncargoWithJoins(id: string, brandId: string) {
  const [encargo] = await db
    .select()
    .from(encargos)
    .where(and(eq(encargos.id, id), eq(encargos.brandId, brandId)))
    .limit(1)

  if (!encargo) return null

  const [customer, advisor, service, items] = await Promise.all([
    encargo.customerId
      ? db.select({ name: customers.name, phone: customers.phone, celular: customers.celular })
          .from(customers).where(eq(customers.id, encargo.customerId)).limit(1).then(r => r[0] ?? null)
      : Promise.resolve(null),
    encargo.advisorId
      ? db.select({ name: users.name }).from(users).where(eq(users.id, encargo.advisorId)).limit(1).then(r => r[0] ?? null)
      : Promise.resolve(null),
    encargo.serviceId
      ? db.select({ name: encargoServices.name }).from(encargoServices).where(eq(encargoServices.id, encargo.serviceId)).limit(1).then(r => r[0] ?? null)
      : Promise.resolve(null),
    db.select().from(encargoItems).where(eq(encargoItems.encargoId, id)),
  ])

  return {
    ...encargo,
    price:           Number(encargo.price ?? 0),
    receivedAt:      encargo.receivedAt?.toISOString() ?? null,
    deliveredAt:     encargo.deliveredAt?.toISOString() ?? null,
    readyAt:         encargo.readyAt?.toISOString() ?? null,
    notifiedAt:      encargo.notifiedAt?.toISOString() ?? null,
    createdAt:       encargo.createdAt?.toISOString() ?? null,
    updatedAt:       encargo.updatedAt?.toISOString() ?? null,
    customerName:    customer?.name ?? null,
    customerPhone:   customer?.phone ?? null,
    customerCelular: customer?.celular ?? null,
    advisorName:     advisor?.name ?? null,
    serviceName:     service?.name ?? null,
    encargoItems:    items.map(it => ({ ...it, unitPrice: Number(it.unitPrice ?? 0) })),
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { brandId } = await getContext()

  const result = await fetchEncargoWithJoins(id, brandId)
  if (!result) return NextResponse.json({ error: 'Encargo no encontrado' }, { status: 404 })

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { brandId } = await getContext()

  const body = await req.json().catch(() => ({}))

  const allowed: Record<string, any> = {}
  const fields = ['status', 'readyAt', 'deliveredAt', 'notes', 'price', 'paid', 'advisorId', 'notifiedAt'] as const
  for (const f of fields) {
    if (f in body) allowed[f] = body[f]
  }

  if ('price' in allowed) allowed.price = String(allowed.price)
  if ('readyAt' in allowed && allowed.readyAt) allowed.readyAt = new Date(allowed.readyAt)
  if ('deliveredAt' in allowed && allowed.deliveredAt) allowed.deliveredAt = new Date(allowed.deliveredAt)
  if ('notifiedAt' in allowed && allowed.notifiedAt) allowed.notifiedAt = new Date(allowed.notifiedAt)

  allowed.updatedAt = new Date()

  await db
    .update(encargos)
    .set(allowed)
    .where(and(eq(encargos.id, id), eq(encargos.brandId, brandId)))

  const result = await fetchEncargoWithJoins(id, brandId)
  return NextResponse.json({ encargo: result })
}
