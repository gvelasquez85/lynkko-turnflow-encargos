import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { memberships, establishments, users } from '@/lib/db/schema'
import { eq, and, count, desc, ne } from '@lynkko/db'

export async function POST(req: NextRequest) {
  const { brandId } = await getContext()

  const body = await req.json()
  const { newEst, newAdv } = body as { newEst: number; newAdv: number }

  if (!newEst || !newAdv || newEst < 1 || newAdv < 1)
    return NextResponse.json({ error: 'Valores inválidos' }, { status: 400 })

  const [[estRow], [advRow]] = await Promise.all([
    db.select({ count: count() }).from(establishments)
      .where(eq(establishments.brandId, brandId)),
    db.select({ count: count() }).from(users)
      .where(and(eq(users.brandId, brandId), ne(users.role, 'brand_admin'))),
  ])

  const estCount = estRow?.count ?? 0
  const advCount = advRow?.count ?? 0

  if (newEst < estCount)
    return NextResponse.json({ error: `No puedes bajar a ${newEst} sucursal${newEst !== 1 ? 'es' : ''} — tienes ${estCount} activas` }, { status: 400 })
  if (newAdv < advCount)
    return NextResponse.json({ error: `No puedes bajar a ${newAdv} usuarios — tienes ${advCount} activos` }, { status: 400 })
  if (newAdv < newEst * 2)
    return NextResponse.json({ error: `Cada sucursal incluye 2 usuarios (mínimo ${newEst * 2} para ${newEst} sucursal${newEst !== 1 ? 'es' : ''})` }, { status: 400 })

  const [membership] = await db
    .select({ id: memberships.id, plan: memberships.plan })
    .from(memberships)
    .where(eq(memberships.brandId, brandId))
    .orderBy(desc(memberships.createdAt))
    .limit(1)

  if (!membership)
    return NextResponse.json({ error: 'Sin membresía' }, { status: 404 })

  await db
    .update(memberships)
    .set({
      maxEstablishments: newEst,
      maxAdvisors: newAdv,
      plan: membership.plan === 'free' && (newEst > 1 || newAdv > 2) ? 'standard' : membership.plan,
    })
    .where(eq(memberships.id, membership.id))

  return NextResponse.json({ ok: true, newEst, newAdv })
}
