import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import { customers, customerHistory } from '@/lib/db/schema'
import { eq, and, desc } from '@lynkko/db'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { brandId, db } = await getContext()
    const { id } = await params

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, brandId)))
      .limit(1)

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const history = await db
      .select()
      .from(customerHistory)
      .where(eq(customerHistory.customerId, id))
      .orderBy(desc(customerHistory.fecha))
      .limit(20)

    return NextResponse.json({ data: { ...customer, history } })
  } catch (err) {
    console.error('[GET /api/clientes/[id]]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { brandId, db } = await getContext()
    const { id } = await params

    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, brandId)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const body = (await req.json()) as {
      name?: string
      phone?: string
      celular?: string
      email?: string
      documentId?: string
      notes?: string
      canalContacto?: string
      intereses?: string[]
      cumpleanos?: string | null
    }

    const updates: Partial<typeof customers.$inferInsert> = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.phone !== undefined) updates.phone = body.phone?.trim() ?? null
    if (body.celular !== undefined) updates.celular = body.celular?.trim() ?? null
    if (body.email !== undefined) updates.email = body.email?.trim() ?? null
    if (body.documentId !== undefined) updates.documentId = body.documentId?.trim() ?? null
    if (body.notes !== undefined) updates.notes = body.notes?.trim() ?? null
    if (body.canalContacto !== undefined) updates.canalContacto = body.canalContacto?.trim() ?? null
    if (body.intereses !== undefined) updates.intereses = body.intereses ?? []
    if (body.cumpleanos !== undefined) updates.cumpleanos = body.cumpleanos ?? null

    const [updated] = await db
      .update(customers)
      .set(updates)
      .where(and(eq(customers.id, id), eq(customers.brandId, brandId)))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/clientes/[id]]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { brandId, role, db } = await getContext()
    if (role !== 'brand_admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params

    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, brandId)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, brandId)))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/clientes/[id]]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
