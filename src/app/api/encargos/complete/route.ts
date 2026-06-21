import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargos, encargoItems, encargoServices, sales, saleItems, customers, users } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

export async function POST(req: NextRequest) {
  const { brandId, userId } = await getContext()

  const body = await req.json().catch(() => null)
  const { encargoId } = body ?? {}
  if (!encargoId) return NextResponse.json({ error: 'encargoId requerido' }, { status: 400 })

  const [encargo] = await db
    .select()
    .from(encargos)
    .where(and(eq(encargos.id, encargoId), eq(encargos.brandId, brandId)))
    .limit(1)

  if (!encargo) return NextResponse.json({ error: 'Encargo no encontrado' }, { status: 404 })

  const items = await db
    .select()
    .from(encargoItems)
    .where(eq(encargoItems.encargoId, encargoId))

  const now = new Date()

  await db
    .update(encargos)
    .set({ status: 'delivered', deliveredAt: now, updatedAt: now })
    .where(and(eq(encargos.id, encargoId), eq(encargos.brandId, brandId)))

  const saleId = encargo.saleId ?? null

  if (saleId) {
    await db
      .update(sales)
      .set({ status: 'completed', updatedAt: now })
      .where(eq(sales.id, saleId))
  } else {
    const total = items.length > 0
      ? items.reduce((s, it) => s + Number(it.unitPrice) * it.quantity, 0)
      : Number(encargo.price ?? 0)

    const [sale] = await db
      .insert(sales)
      .values({
        brandId: encargo.brandId,
        type: 'sale',
        status: 'completed',
        customerId: encargo.customerId ?? null,
        subtotal: String(total),
        discount: '0',
        total: String(total),
        notes: `Encargo #${encargo.orderCode} — ${encargo.itemDescription}`,
        createdBy: userId,
      })
      .returning({ id: sales.id })

    if (sale) {
      if (items.length > 0) {
        await db.insert(saleItems).values(
          items.map(it => ({
            saleId:      sale.id,
            productId:   it.sourceType === 'product' ? (it.sourceId ?? null) : null,
            productName: it.name,
            productSku:  null,
            qty:         String(it.quantity),
            unitPrice:   String(it.unitPrice),
            discount:    '0',
            lineTotal:   String(Number(it.unitPrice) * it.quantity),
          }))
        )
      } else {
        await db.insert(saleItems).values({
          saleId:      sale.id,
          productId:   encargo.serviceId ?? null,
          productName: encargo.itemDescription,
          productSku:  null,
          qty:         '1',
          unitPrice:   String(encargo.price ?? 0),
          discount:    '0',
          lineTotal:   String(encargo.price ?? 0),
        })
      }
      await db.update(encargos).set({ saleId: sale.id }).where(eq(encargos.id, encargoId))
    }
  }

  // Fetch updated encargo with joins for response
  const [updated] = await db.select().from(encargos).where(eq(encargos.id, encargoId)).limit(1)

  const [customer] = encargo.customerId
    ? await db.select({ name: customers.name, phone: customers.phone, celular: customers.celular })
        .from(customers).where(eq(customers.id, encargo.customerId)).limit(1)
    : [null]

  const [advisor] = encargo.advisorId
    ? await db.select({ name: users.name }).from(users).where(eq(users.id, encargo.advisorId)).limit(1)
    : [null]

  const [service] = encargo.serviceId
    ? await db.select({ name: encargoServices.name }).from(encargoServices).where(eq(encargoServices.id, encargo.serviceId)).limit(1)
    : [null]

  const responseEncargo = {
    ...updated,
    price:        Number(updated?.price ?? 0),
    receivedAt:   updated?.receivedAt?.toISOString() ?? null,
    deliveredAt:  updated?.deliveredAt?.toISOString() ?? null,
    readyAt:      updated?.readyAt?.toISOString() ?? null,
    notifiedAt:   updated?.notifiedAt?.toISOString() ?? null,
    createdAt:    updated?.createdAt?.toISOString() ?? null,
    updatedAt:    updated?.updatedAt?.toISOString() ?? null,
    customerName:    customer?.name ?? null,
    customerPhone:   customer?.phone ?? null,
    customerCelular: customer?.celular ?? null,
    advisorName:     advisor?.name ?? null,
    serviceName:     service?.name ?? null,
  }

  return NextResponse.json({ ok: true, encargo: responseEncargo })
}
