import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import { customers } from '@/lib/db/schema'
import { eq, and, or, ilike, desc, sql } from '@lynkko/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { brandId, db } = await getContext()
    const { searchParams } = req.nextUrl
    const q = searchParams.get('q') ?? ''
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)
    const offset = Number(searchParams.get('offset') ?? 0)

    const conditions = [eq(customers.brandId, brandId)]
    if (q) {
      const search = or(
        ilike(customers.name, `%${q}%`),
        ilike(customers.phone, `%${q}%`),
        ilike(customers.email, `%${q}%`),
        ilike(customers.documentId, `%${q}%`),
      )
      if (search) conditions.push(search)
    }

    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        celular: customers.celular,
        email: customers.email,
        documentId: customers.documentId,
        canalContacto: customers.canalContacto,
        lastVisitAt: customers.lastVisitAt,
        totalVisits: customers.totalVisits,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.lastVisitAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/clientes]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { brandId, db } = await getContext()
    const body = (await req.json()) as {
      name: string
      phone?: string
      email?: string
      documentId?: string
      notes?: string
      canalContacto?: string
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    // Verificar duplicados por phone
    if (body.phone?.trim()) {
      const existing = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.brandId, brandId), eq(customers.phone, body.phone.trim())))
        .limit(1)
      if (existing.length > 0) {
        return NextResponse.json(
          { error: `Ya existe un cliente con el teléfono ${body.phone.trim()}` },
          { status: 409 },
        )
      }
    }

    // Verificar duplicados por documentId
    if (body.documentId?.trim()) {
      const existing = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.brandId, brandId), eq(customers.documentId, body.documentId.trim())))
        .limit(1)
      if (existing.length > 0) {
        return NextResponse.json(
          { error: `Ya existe un cliente con el documento ${body.documentId.trim()}` },
          { status: 409 },
        )
      }
    }

    const [created] = await db
      .insert(customers)
      .values({
        brandId,
        name: body.name.trim(),
        phone: body.phone?.trim() ?? null,
        email: body.email?.trim() ?? null,
        documentId: body.documentId?.trim() ?? null,
        notes: body.notes?.trim() ?? null,
        canalContacto: body.canalContacto?.trim() ?? null,
        establishmentIds: [],
      })
      .returning()

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clientes]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
