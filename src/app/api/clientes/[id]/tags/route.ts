import { NextRequest } from 'next/server'
import { ok, created, badRequest, notFound, unauthorized, serverError } from '@lynkko/utils'
import { getContext } from '@/lib/context'
import { customers, customerTags } from '@/lib/db/schema'
import { and, eq } from '@lynkko/db'

type Params = { params: Promise<{ id: string }> }

// GET /api/clientes/[id]/tags
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

    const tags = await ctx.db
      .select()
      .from(customerTags)
      .where(eq(customerTags.customerId, id))

    return ok(tags)
  } catch (e) {
    console.error('[GET /api/clientes/id/tags]', e)
    return serverError()
  }
}

// POST /api/clientes/[id]/tags — agregar etiqueta
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getContext()
    const { id } = await params
    const { tagKey, tagLabel } = await req.json()

    if (!tagKey) return badRequest('tagKey requerido')

    const [cust] = await ctx.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, ctx.brandId)))
      .limit(1)
    if (!cust) return notFound()

    const [tag] = await ctx.db
      .insert(customerTags)
      .values({ customerId: id, tagKey, createdById: ctx.userId })
      .onConflictDoNothing()
      .returning()

    return created(tag ?? { customerId: id, tagKey })
  } catch (e) {
    console.error('[POST /api/clientes/id/tags]', e)
    return serverError()
  }
}

// DELETE /api/clientes/[id]/tags?tagKey=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getContext()
    const { id } = await params
    const tagKey = new URL(req.url).searchParams.get('tagKey')

    if (!tagKey) return badRequest('tagKey requerido')

    await ctx.db
      .delete(customerTags)
      .where(and(eq(customerTags.customerId, id), eq(customerTags.tagKey, tagKey)))

    return ok({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/clientes/id/tags]', e)
    return serverError()
  }
}
