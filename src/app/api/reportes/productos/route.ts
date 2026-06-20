import { NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { products, saleItems, sales } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

export async function GET() {
  try {
    const { db, brandId } = await getContext()

    const [productRows, saleItemRows] = await Promise.all([
      db
        .select({
          id:       products.id,
          name:     products.name,
          stock:    products.stock,
          minStock: products.minStock,
          price:    products.price,
          category: products.category,
        })
        .from(products)
        .where(and(eq(products.brandId, brandId), eq(products.active, true))),

      db
        .select({
          productId:   saleItems.productId,
          productName: saleItems.productName,
          qty:         saleItems.qty,
          lineTotal:   saleItems.lineTotal,
          saleCreatedAt: sales.createdAt,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(and(
          eq(sales.brandId, brandId),
          eq(sales.type, 'sale'),
          eq(sales.status, 'completed'),
        )),
    ])

    return NextResponse.json({ products: productRows, saleItems: saleItemRows })
  } catch (e) {
    console.error('[GET /api/reportes/productos]', e)
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 })
  }
}
