import { NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { customers, establishments } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

export async function GET() {
  try {
    const { db, brandId } = await getContext()

    const [customerRows, estRows] = await Promise.all([
      db
        .select({
          id:             customers.id,
          name:           customers.name,
          totalVisits:    customers.totalVisits,
          firstVisitAt:   customers.firstVisitAt,
          lastVisitAt:    customers.lastVisitAt,
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

    return NextResponse.json({ customers: customerRows, establishments: estRows })
  } catch (e) {
    console.error('[GET /api/reportes/clientes]', e)
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 })
  }
}
