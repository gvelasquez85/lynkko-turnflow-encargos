import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { visitReasons } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getContext()
    if (!['brand_admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json()
    const patch: Record<string, unknown> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.description !== undefined) patch.description = body.description
    if (body.active !== undefined) patch.active = body.active
    if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder

    const [updated] = await ctx.db
      .update(visitReasons)
      .set(patch)
      .where(and(eq(visitReasons.id, id), eq(visitReasons.brandId, ctx.brandId)))
      .returning()

    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getContext()
    if (!['brand_admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { id } = await params
    await ctx.db.delete(visitReasons).where(and(eq(visitReasons.id, id), eq(visitReasons.brandId, ctx.brandId)))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
