import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encargos, customers } from '@/lib/db/schema'
import { eq, desc, sql } from '@lynkko/db'
import { getContext } from '@/lib/context'
import { HomePanel } from './HomePanel'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const ctx = await getContext()

  // Get recent encargos
  const recentEncargos = await db
    .select({
      id: encargos.id,
      orderCode: encargos.orderCode,
      itemDescription: encargos.itemDescription,
      status: encargos.status,
      price: encargos.price,
      createdAt: encargos.createdAt,
      customerName: customers.name,
    })
    .from(encargos)
    .leftJoin(customers, eq(customers.id, encargos.customerId))
    .where(eq(encargos.brandId, ctx.brandId))
    .orderBy(desc(encargos.createdAt))
    .limit(10)

  // Get stats using raw SQL
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'received' THEN 1 END) as received,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered
    FROM encargos WHERE brand_id = ${ctx.brandId}
  `)

  const clientCount = await db.execute(sql`
    SELECT COUNT(*) as total FROM customers WHERE brand_id = ${ctx.brandId}
  `)

  const row = stats.rows?.[0] || {}

  return (
    <HomePanel
      brandName={ctx.brandId || 'Turnflow'}
      userName={ctx.userId}
      encargosRecientes={recentEncargos as any}
      stats={{
        total: Number(row.total) || 0,
        received: Number(row.received) || 0,
        inProgress: Number(row.in_progress) || 0,
        ready: Number(row.ready) || 0,
        delivered: Number(row.delivered) || 0,
      }}
      totalClients={Number(clientCount.rows?.[0]?.total) || 0}
    />
  )
}
