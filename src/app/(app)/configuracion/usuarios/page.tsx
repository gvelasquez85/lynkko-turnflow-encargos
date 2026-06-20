import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import { users, establishments, memberships } from '@/lib/db/schema'
import { eq, and, desc } from '@lynkko/db'
import { UsersPanel } from './UsersPanel'
import { getLimits } from '@/lib/planLimits'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Usuarios' }
export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string }
  if (!['brand_admin', 'manager'].includes(user.role ?? '')) redirect('/configuracion')

  const { db, brandId } = await getContext()

  const [userList, estabList, membership] = await Promise.all([
    db.select({
      id:              users.id,
      name:            users.name,
      email:           users.email,
      role:            users.role,
      establishmentId: users.establishmentId,
    }).from(users).where(eq(users.brandId, brandId)),

    db.select({ id: establishments.id, name: establishments.name })
      .from(establishments)
      .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true))),

    db.select({ plan: memberships.plan, maxAdvisors: memberships.maxAdvisors })
      .from(memberships)
      .where(eq(memberships.brandId, brandId))
      .orderBy(desc(memberships.createdAt))
      .limit(1)
      .then(r => r[0] ?? null),
  ])

  const limits = getLimits(membership?.plan ?? 'free')
  const maxAdvisors = membership?.maxAdvisors ?? limits.maxAdvisors

  const estabMap = new Map(estabList.map(e => [e.id, e.name]))

  const mappedUsers = userList.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as 'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting',
    establishmentId: u.establishmentId ?? null,
    establishmentName: u.establishmentId ? (estabMap.get(u.establishmentId) ?? null) : null,
  }))

  const estUserCounts: Record<string, number> = {}
  for (const u of userList) {
    if (u.establishmentId && u.role !== 'brand_admin') {
      estUserCounts[u.establishmentId] = (estUserCounts[u.establishmentId] ?? 0) + 1
    }
  }

  const teamCount = userList.filter(u => u.role !== 'brand_admin').length
  const includedSlots = estabList.length * 2
  const availableExtraSlots = Math.max(0, maxAdvisors - includedSlots - teamCount)

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-500 mt-1">Gestiona el equipo de tu negocio</p>
      </div>
      <UsersPanel
        users={mappedUsers}
        establishments={estabList}
        maxAdvisors={maxAdvisors}
        estUserCounts={estUserCounts}
        availableExtraSlots={availableExtraSlots}
      />
    </div>
  )
}
