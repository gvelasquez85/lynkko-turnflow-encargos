import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { establishments } from '@/lib/db/schema'
import { eq } from '@lynkko/db'
import { EstablishmentForm } from './EstablishmentForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Establecimiento' }

export default async function EstablecimientoPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string; establishmentId?: string }
  if (!['brand_admin', 'manager'].includes(user.role ?? '')) redirect('/configuracion')
  if (!user.establishmentId) redirect('/onboarding')

  const [estab] = await db
    .select()
    .from(establishments)
    .where(eq(establishments.id, user.establishmentId))

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Establecimiento</h1>
        <p className="text-gray-500 mt-1">Información de tu sucursal</p>
      </div>
      <EstablishmentForm initial={estab ?? null} />
    </div>
  )
}
