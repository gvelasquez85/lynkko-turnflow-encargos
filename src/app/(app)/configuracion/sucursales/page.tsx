import { redirect } from 'next/navigation'
import { getContext } from '@/lib/context'
import { establishments, brands, memberships, tickets } from '@/lib/db/schema'
import { and, eq, asc, inArray, gte, or, sql } from '@lynkko/db'
import { getLimits } from '@/lib/planLimits'
import { EstablishmentsManager } from './EstablishmentsManager'

export const dynamic = 'force-dynamic'

export default async function SucursalesPage() {
  const { db, brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin'].includes(role))
    redirect('/app')

  const estQuery = db.select().from(establishments).orderBy(asc(establishments.createdAt))
  if (role !== 'superadmin') {
    estQuery.where(eq(establishments.brandId, brandId))
  }
  const estRows = await estQuery

  const [brandRow, membershipRow, allBrands] = await Promise.all([
    db.select({ activeModules: brands.activeModules }).from(brands).where(eq(brands.id, brandId)).limit(1).then(r => r[0] ?? null),
    db.select({ plan: memberships.plan, maxEstablishments: memberships.maxEstablishments, maxAdvisors: memberships.maxAdvisors })
      .from(memberships).where(eq(memberships.brandId, brandId)).limit(1).then(r => r[0] ?? null),
    role === 'superadmin'
      ? db.select({ id: brands.id, name: brands.name, slug: brands.slug }).from(brands).where(eq(brands.active, true))
      : Promise.resolve([]),
  ])

  const activeModules = (brandRow?.activeModules as Record<string, boolean>) ?? {}
  const hasQueue = !!(activeModules?.queue)

  const estIds = estRows.map(e => e.id)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  let ticketStats: Record<string, { waiting: number; today: number }> = {}
  if (hasQueue && estIds.length > 0) {
    const stats = await db.select({
      establishmentId: tickets.establishmentId,
      status: tickets.status,
      createdAt: tickets.createdAt,
    })
      .from(tickets)
      .where(and(
        inArray(tickets.establishmentId, estIds),
        sql`(${tickets.status} in ('waiting', 'in_progress') or (${tickets.status} = 'done' and ${tickets.createdAt} >= ${todayStart}))`,
      ))

    for (const t of stats) {
      const eid = t.establishmentId!
      if (!ticketStats[eid]) ticketStats[eid] = { waiting: 0, today: 0 }
      if (t.status === 'waiting' || t.status === 'in_progress') ticketStats[eid].waiting++
      if (t.status === 'done') ticketStats[eid].today++
    }
  }

  const limits = getLimits(membershipRow?.plan ?? 'free')
  const maxEstablishments = membershipRow?.maxEstablishments ?? limits.maxEstablishments

  return (
    <EstablishmentsManager
      establishments={estRows as any[]}
      brands={allBrands}
      defaultBrandId={brandId}
      ticketStats={ticketStats}
      hasQueue={hasQueue}
      isSuperAdmin={role === 'superadmin'}
      maxEstablishments={maxEstablishments}
    />
  )
}
