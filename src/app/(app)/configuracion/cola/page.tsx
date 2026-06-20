import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { visitReasons, advisorFields } from '@/lib/db/schema'
import { eq, asc } from '@lynkko/db'
import { QueueConfigPanel } from './QueueConfigPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Config. cola' }
export const dynamic = 'force-dynamic'

export default async function ColaConfigPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string; brandId?: string; establishmentId?: string }
  if (!['brand_admin', 'manager'].includes(user.role ?? '')) redirect('/configuracion')
  if (!user.brandId) redirect('/onboarding')

  const [reasons, fields] = await Promise.all([
    user.brandId
      ? db.select().from(visitReasons)
          .where(eq(visitReasons.brandId, user.brandId))
          .orderBy(asc(visitReasons.sortOrder), asc(visitReasons.createdAt))
      : Promise.resolve([]),

    user.establishmentId
      ? db.select().from(advisorFields)
          .where(eq(advisorFields.establishmentId, user.establishmentId))
          .orderBy(asc(advisorFields.sortOrder), asc(advisorFields.createdAt))
      : Promise.resolve([]),
  ])

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cola de turnos</h1>
        <p className="text-gray-500 mt-1">Configura motivos de visita y campos del formulario</p>
      </div>
      <QueueConfigPanel
        initialReasons={reasons}
        initialFields={fields}
      />
    </div>
  )
}
