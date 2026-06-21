import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { establishments } from '@/lib/db/schema'
import { and, eq } from '@lynkko/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, brandId, role } = await getContext()
    if (!['brand_admin', 'manager', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })

    const [existing] = await db.select({ id: establishments.id })
      .from(establishments)
      .where(and(eq(establishments.id, id), eq(establishments.brandId, brandId)))
      .limit(1)

    if (!existing) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })

    const patch: Record<string, unknown> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.slug !== undefined) patch.slug = body.slug
    if (body.address !== undefined) patch.address = body.address
    if (body.active !== undefined) patch.active = body.active
    if (body.features !== undefined) patch.features = body.features

    const [updated] = await db.update(establishments)
      .set(patch)
      .where(and(eq(establishments.id, id), eq(establishments.brandId, brandId)))
      .returning()

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, brandId, role } = await getContext()
    if (!['brand_admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const [existing] = await db.select({ id: establishments.id })
      .from(establishments)
      .where(and(eq(establishments.id, id), eq(establishments.brandId, brandId)))
      .limit(1)

    if (!existing) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })

    await db.delete(establishments).where(and(eq(establishments.id, id), eq(establishments.brandId, brandId)))

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
