import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargos, encargoItems, sales, saleItems } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

export async function POST(req: NextRequest) {
  const { brandId, userId } = await getContext()

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })

  const { items = [], ...payload } = body as {
    items?: {
      sourceType?: string
      sourceId?: string | null
      name: string
      quantity: number
      unitPrice: number
      sortOrder?: number
    }[]
    [key: string]: any
  }

  // ── Wrap everything in a transaction for atomicity ──
  const result = await db.transaction(async (tx) => {
    const [encargo] = await tx
      .insert(encargos)
      .values({
        brandId,
        customerId:      payload.customerId ?? null,
        orderCode:       payload.orderCode,
        serviceId:       payload.serviceId ?? null,
        itemDescription: payload.itemDescription,
        itemColor:       payload.itemColor ?? null,
        itemBrand:       payload.itemBrand ?? null,
        initialNotes:    payload.initialNotes ?? null,
        promisedDate:    payload.promisedDate,
        price:           String(payload.price ?? 0),
        advisorId:       payload.advisorId ?? null,
        notifyWhatsapp:  payload.notifyWhatsapp ?? true,
        notes:           payload.notes ?? null,
        customerEmail:   payload.customerEmail ?? null,
      })
      .returning({
        id:              encargos.id,
        orderCode:       encargos.orderCode,
        price:           encargos.price,
        itemDescription: encargos.itemDescription,
        customerId:      encargos.customerId,
        brandId:         encargos.brandId,
        serviceId:       encargos.serviceId,
      })

    if (!encargo) {
      throw new Error('No se pudo crear el encargo')
    }

    if (items.length > 0) {
      await tx.insert(encargoItems).values(
        items.map((it, idx) => ({
          encargoId: encargo.id,
          sourceType: it.sourceType ?? 'custom',
          sourceId:   it.sourceId ?? null,
          name:       it.name,
          quantity:   it.quantity,
          unitPrice:  String(it.unitPrice),
          sortOrder:  it.sortOrder ?? idx,
        }))
      )
    }

    const total = items.length > 0
      ? items.reduce((s, it) => s + it.unitPrice * it.quantity, 0)
      : Number(encargo.price ?? 0)

    const [sale] = await tx
      .insert(sales)
      .values({
        brandId:   encargo.brandId,
        type:      'sale',
        status:    'draft',
        customerId: encargo.customerId ?? null,
        subtotal:  String(total),
        discount:  '0',
        total:     String(total),
        notes:     `Encargo #${encargo.orderCode} — ${encargo.itemDescription}`,
        createdBy: userId,
      })
      .returning({ id: sales.id })

    if (sale) {
      if (items.length > 0) {
        await tx.insert(saleItems).values(
          items.map(it => ({
            saleId:      sale.id,
            productId:   it.sourceType === 'product' ? (it.sourceId ?? null) : null,
            productName: it.name,
            productSku:  null,
            qty:         String(it.quantity),
            unitPrice:   String(it.unitPrice),
            discount:    '0',
            lineTotal:   String(it.quantity * it.unitPrice),
          }))
        )
      } else {
        await tx.insert(saleItems).values({
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
      await tx.update(encargos).set({ saleId: sale.id }).where(eq(encargos.id, encargo.id))
    }

    return { encargoId: encargo.id, saleId: sale?.id ?? null, saleCreated: !!sale }
  })

  return NextResponse.json({ ok: true, ...result })
}
