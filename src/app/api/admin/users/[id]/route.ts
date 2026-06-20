import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { users, accounts } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'
import { hashPassword } from 'better-auth/crypto'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getContext()
    if (!['brand_admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json()

    // Handle password change separately (updates accounts table)
    if (body.password !== undefined) {
      if (!body.password || body.password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }
      const [targetUser] = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, id), eq(users.brandId, ctx.brandId)))
      if (!targetUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

      const hashed = await hashPassword(body.password)
      await ctx.db
        .update(accounts)
        .set({ password: hashed })
        .where(and(eq(accounts.userId, id), eq(accounts.providerId, 'credential')))

      return NextResponse.json({ ok: true })
    }

    const allowed = ['name', 'role', 'establishmentId', 'active'] as const
    const patch: Record<string, unknown> = {}
    for (const k of allowed) {
      if (body[k] !== undefined) patch[k] = body[k]
    }

    const [updated] = await ctx.db
      .update(users)
      .set(patch)
      .where(and(eq(users.id, id), eq(users.brandId, ctx.brandId)))
      .returning({ id: users.id, name: users.name, role: users.role, active: users.active })

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

    const [target] = await ctx.db
      .select({ role: users.role })
      .from(users)
      .where(and(eq(users.id, id), eq(users.brandId, ctx.brandId)))

    if (!target) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    if (target.role === 'brand_admin') {
      return NextResponse.json({ error: 'No puedes eliminar al administrador de marca' }, { status: 403 })
    }

    await ctx.db
      .update(users)
      .set({ active: false })
      .where(and(eq(users.id, id), eq(users.brandId, ctx.brandId)))

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
