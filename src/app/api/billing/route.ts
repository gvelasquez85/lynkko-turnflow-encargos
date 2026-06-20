import { NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { memberships, billingTransactions } from '@/lib/db/schema'
import { eq, desc } from '@lynkko/db'

export async function GET() {
  try {
    const ctx = await getContext()
    if (ctx.role !== 'brand_admin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const [membership] = await ctx.db
      .select()
      .from(memberships)
      .where(eq(memberships.brandId, ctx.brandId))
      .limit(1)

    const transactions = await ctx.db
      .select()
      .from(billingTransactions)
      .where(eq(billingTransactions.brandId, ctx.brandId))
      .orderBy(desc(billingTransactions.createdAt))
      .limit(20)

    return NextResponse.json({ membership: membership ?? null, transactions })
  } catch {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
}
