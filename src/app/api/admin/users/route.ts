import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, establishments } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const ctx = await getContext()

    const list = await ctx.db
      .select({
        id:              users.id,
        name:            users.name,
        email:           users.email,
        role:            users.role,
        establishmentId: users.establishmentId,
        active:          users.active,
        createdAt:       users.createdAt,
      })
      .from(users)
      .where(eq(users.brandId, ctx.brandId))
      .orderBy(users.createdAt)

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

    const { name, email, password, role, establishmentId } = await req.json()

    if (!name?.trim() || !email?.trim() || !password || !role) {
      return NextResponse.json({ error: 'Campos requeridos: nombre, email, contraseña, rol' }, { status: 400 })
    }

    // Validate establishment belongs to this brand
    if (establishmentId) {
      const [estab] = await ctx.db
        .select({ id: establishments.id })
        .from(establishments)
        .where(and(eq(establishments.id, establishmentId), eq(establishments.brandId, ctx.brandId)))
      if (!estab) return NextResponse.json({ error: 'Establecimiento inválido' }, { status: 400 })
    }

    await auth.api.signUpEmail({
      body: { name: name.trim(), email: email.trim().toLowerCase(), password },
      headers: await headers(),
    })

    // Update brandId, establishmentId, role — not settable via signUp
    await db
      .update(users)
      .set({
        role:            role,
        brandId:         ctx.brandId,
        establishmentId: establishmentId ?? ctx.establishmentId,
      })
      .where(eq(users.email, email.trim().toLowerCase()))

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
