import { NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { sales, customers, establishments } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

export async function GET() {
  try {
    const { db, brandId } = await getContext()

    const [salesRows, estRows] = await Promise.all([
      db
        .select({
          id:             sales.id,
          type:           sales.type,
          status:         sales.status,
          total:          sales.total,
          subtotal:       sales.subtotal,
          discount:       sales.discount,
          createdAt:      sales.createdAt,
          establishmentId: sales.establishmentId,
          customerId:     sales.customerId,
          customerName:   customers.name,
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .where(and(eq(sales.brandId, brandId), eq(sales.type, 'sale')))
        .orderBy(sales.createdAt),

      db
        .select({ id: establishments.id, name: establishments.name })
        .from(establishments)
        .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true)))
        .orderBy(establishments.name),
    ])

    return NextResponse.json({ sales: salesRows, establishments: estRows })
  } catch (e) {
    console.error('[GET /api/reportes/ventas]', e)
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 })
  }
}
