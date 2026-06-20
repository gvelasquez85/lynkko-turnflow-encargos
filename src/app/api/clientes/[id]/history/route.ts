import { NextRequest } from 'next/server'
import { ok, created, badRequest, notFound, serverError } from '@lynkko/utils'
import { getContext } from '@/lib/context'
import { customers, customerHistory } from '@/lib/db/schema'
import { and, eq, desc } from '@lynkko/db'

type Params = { params: Promise<{ id: string }> }

// GET /api/clientes/[id]/history
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getContext()
    const { id } = await params

    const [cust] = await ctx.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, ctx.brandId)))
      .limit(1)
    if (!cust) return notFound()

    const history = await ctx.db
      .select()
      .from(customerHistory)
      .where(eq(customerHistory.customerId, id))
      .orderBy(desc(customerHistory.fecha))
      .limit(50)

    return ok(history)
  } catch (e) {
    console.error('[GET /api/clientes/id/history]', e)
    return serverError()
  }
}

// DELETE /api/clientes/[id]/history?historyId=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getContext()
    const { id } = await params
    const historyId = new URL(req.url).searchParams.get('historyId')

    if (!historyId) return badRequest('historyId requerido')

    const [cust] = await ctx.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, ctx.brandId)))
      .limit(1)
    if (!cust) return notFound()

    await ctx.db
      .delete(customerHistory)
      .where(and(eq(customerHistory.id, historyId), eq(customerHistory.customerId, id)))

    return ok({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/clientes/id/history]', e)
    return serverError()
  }
}

// POST /api/clientes/[id]/history — agregar nota/registro
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getContext()
    const { id } = await params
    const body = await req.json()
    const { tipo, detalles, monto } = body

    if (!tipo || !detalles) return badRequest('tipo y detalles requeridos')

    const [cust] = await ctx.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, ctx.brandId)))
      .limit(1)
    if (!cust) return notFound()

    const [entry] = await ctx.db
      .insert(customerHistory)
      .values({
        customerId:      id,
        establishmentId: ctx.establishmentId ?? null,
        tipo,
        detalles,
        monto:           monto ? String(parseFloat(monto).toFixed(2)) : null,
      })
      .returning()

    return created(entry)
  } catch (e) {
    console.error('[POST /api/clientes/id/history]', e)
    return serverError()
  }
}
