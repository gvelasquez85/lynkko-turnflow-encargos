import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { memberships, establishments, users } from '@/lib/db/schema'
import { eq, and, count, desc } from '@lynkko/db'
import { PLANS, normalizePlan, type PlanKey } from '@/lib/planLimits'

export async function POST(req: NextRequest) {
  const { brandId, role } = await getContext()

  if (!['brand_admin', 'superadmin'].includes(role ?? ''))
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { newPlan, billingCycle = 'monthly' } = body as { newPlan: string; billingCycle?: string }

  const planKey = normalizePlan(newPlan)
  if (!['free', 'essential', 'business'].includes(planKey))
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })

  const planDef = PLANS[planKey as PlanKey]

  const [[estRow], [advRow]] = await Promise.all([
    db.select({ count: count() }).from(establishments)
      .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true))),
    db.select({ count: count() }).from(users)
      .where(eq(users.brandId, brandId)),
  ])

  const estCount = estRow?.count ?? 0
  const advCount = advRow?.count ?? 0

  if (estCount > planDef.maxEstablishments)
    return NextResponse.json({
      error: `Tienes ${estCount} sucursal${estCount !== 1 ? 'es' : ''} activa${estCount !== 1 ? 's' : ''} y el plan ${planDef.name} sólo permite ${planDef.maxEstablishments}. Desactiva sucursales antes de bajar de plan.`,
    }, { status: 400 })

  const newMaxAdvisors = Math.max(planDef.maxUsers, advCount)
  const newMaxEstablishments = Math.max(planDef.maxEstablishments, estCount || 1)

  const updatePayload = {
    plan: planKey as any,
    maxEstablishments: newMaxEstablishments,
    maxAdvisors: newMaxAdvisors,
    ...(planKey === 'free' ? { billingStatus: 'none' as const } : {}),
  }

  const [existing] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.brandId, brandId))
    .orderBy(desc(memberships.createdAt))
    .limit(1)

  let result
  if (existing) {
    const [updated] = await db
      .update(memberships)
      .set(updatePayload)
      .where(eq(memberships.id, existing.id))
      .returning()
    result = updated
  } else {
    const [inserted] = await db
      .insert(memberships)
      .values({ brandId, status: 'active', startedAt: new Date(), ...updatePayload })
      .returning()
    result = inserted
  }

  if (!result) return NextResponse.json({ error: 'Error al actualizar membresía' }, { status: 500 })

  return NextResponse.json({ ok: true, membership: result })
}
