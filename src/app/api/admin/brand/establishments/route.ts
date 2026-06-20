import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { establishments } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

export async function GET() {
  try {
    const { db, brandId } = await getContext()
    const rows = await db.select().from(establishments).where(eq(establishments.brandId, brandId))
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db, brandId, role } = await getContext()
    if (!['brand_admin', 'manager', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })

    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'name y slug son requeridos' }, { status: 400 })
    }

    const [created] = await db.insert(establishments).values({
      brandId,
      name: body.name.trim(),
      slug: body.slug.trim().toLowerCase(),
      address: body.address ?? null,
      active: true,
      features: body.features ?? { queue: true, appointments: false, surveys: false, menu: false },
    }).returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear sucursal' }, { status: 500 })
  }
}
