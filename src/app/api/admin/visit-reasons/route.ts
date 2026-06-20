import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { visitReasons } from '@/lib/db/schema'
import { eq, asc } from '@lynkko/db'

export async function GET() {
  try {
    const ctx = await getContext()
    const list = await ctx.db
      .select()
      .from(visitReasons)
      .where(eq(visitReasons.brandId, ctx.brandId))
      .orderBy(asc(visitReasons.sortOrder), asc(visitReasons.createdAt))
    return NextResponse.json(list)
  } catch {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getContext()
    if (!['brand_admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { name, description } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const [row] = await ctx.db
      .insert(visitReasons)
      .values({ brandId: ctx.brandId, name: name.trim(), description: description?.trim() || null })
      .returning()
    return NextResponse.json(row, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
