import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

export interface AppContext {
  userId:          string
  brandId:         string
  establishmentId: string | null
  role:            string
  db:              typeof db
}

/**
 * Construye el contexto del request desde la sesión de Better Auth.
 * Llámalo al inicio de cada Route Handler o Server Action protegido.
 *
 * @throws Error si no hay sesión activa
 */
export async function getContext(): Promise<AppContext> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) throw new Error('No autenticado')

  const user = session.user as {
    id:              string
    role?:           string
    brandId?:        string
    establishmentId?: string
  }

  if (!user.brandId) throw new Error('Usuario sin brand asignado')

  return {
    userId:          user.id,
    brandId:         user.brandId,
    establishmentId: user.establishmentId ?? null,
    role:            user.role ?? 'advisor',
    db,
  }
}

/**
 * Contexto para superadmin — no requiere brand.
 * Úsalo solo en rutas /superadmin/*.
 */
export async function getSuperadminContext(): Promise<{ userId: string; db: typeof db }> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) throw new Error('No autenticado')

  const user = session.user as { id: string; role?: string }
  if (user.role !== 'superadmin') throw new Error('Acceso denegado')

  return { userId: user.id, db }
}
