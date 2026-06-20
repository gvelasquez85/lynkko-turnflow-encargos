import { NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { sales, saleItems, customers } from '@/lib/db/schema'
import { eq, and, gte } from '@lynkko/db'

export async function GET() {
  try {
    const { db, brandId } = await getContext()

    const since90 = new Date(Date.now() - 90 * 86400000)

    const [quotesRows, quoteItemsRows] = await Promise.all([
      db
        .select({
          id:          sales.id,
          status:      sales.status,
          total:       sales.total,
          createdAt:   sales.createdAt,
          customerName: customers.name,
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .where(and(
          eq(sales.brandId, brandId),
          eq(sales.type, 'quote'),
          gte(sales.createdAt, since90),
        ))
        .orderBy(sales.createdAt),

      db
        .select({
          productName: saleItems.productName,
          qty:         saleItems.qty,
          lineTotal:   saleItems.lineTotal,
          saleId:      saleItems.saleId,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(and(eq(sales.brandId, brandId), eq(sales.type, 'quote'))),
    ])

    return NextResponse.json({ quotes: quotesRows, quoteItems: quoteItemsRows })
  } catch (e) {
    console.error('[GET /api/reportes/cotizaciones]', e)
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 })
  }
}
