import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { establishments } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

export async function GET() {
  try {
    const ctx = await getContext()
    if (!ctx.establishmentId) return NextResponse.json({ error: 'Sin establecimiento' }, { status: 404 })

    const [estab] = await ctx.db
      .select()
      .from(establishments)
      .where(eq(establishments.id, ctx.establishmentId))

    return NextResponse.json(estab ?? null)
  } catch {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getContext()
    if (!ctx.role || !['brand_admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    if (!ctx.establishmentId) return NextResponse.json({ error: 'Sin establecimiento' }, { status: 404 })

    const body = await req.json()
    const allowed = ['name', 'address'] as const
    const patch: Record<string, unknown> = {}
    for (const k of allowed) {
      if (body[k] !== undefined) patch[k] = body[k]
    }

    const [updated] = await ctx.db
      .update(establishments)
      .set(patch)
      .where(eq(establishments.id, ctx.establishmentId))
      .returning()

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
