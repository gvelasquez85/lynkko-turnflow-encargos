import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { brands } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

export async function GET() {
  try {
    const ctx = await getContext()

    const [brand] = await ctx.db
      .select()
      .from(brands)
      .where(eq(brands.id, ctx.brandId))

    if (!brand) return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 })
    return NextResponse.json(brand)
  } catch {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getContext()
    if (!['brand_admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()
    const allowed = ['name', 'logoUrl', 'primaryColor', 'secondaryColor', 'fontColor', 'address', 'contactEmail', 'website', 'language', 'country', 'businessType', 'activeModules'] as const
    const patch: Record<string, unknown> = {}
    for (const k of allowed) {
      if (body[k] !== undefined) patch[k] = body[k]
    }

    if (!patch.name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const [updated] = await ctx.db
      .update(brands)
      .set(patch)
      .where(eq(brands.id, ctx.brandId))
      .returning()

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
