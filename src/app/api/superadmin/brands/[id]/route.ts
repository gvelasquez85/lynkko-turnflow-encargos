import { ok, badRequest, notFound, serverError, unauthorized } from '@lynkko/utils'
import { getSuperadminContext } from '@/lib/context'
import { db } from '@/lib/db'
import { brands } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

// PATCH /api/superadmin/brands/[id] — Update brand (active status, plan, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSuperadminContext()
    const { id } = await params
    const body = await req.json()

    const [existing] = await db.select().from(brands).where(eq(brands.id, id)).limit(1)
    if (!existing) return notFound('Marca no encontrada')

    const updates: Record<string, unknown> = {}
    if (typeof body.active === 'boolean') updates.active = body.active
    if (body.currentPlan) updates.currentPlan = body.currentPlan
    if (body.name) updates.name = body.name

    if (Object.keys(updates).length === 0) return badRequest('No hay campos para actualizar')

    const [updated] = await db.update(brands).set(updates).where(eq(brands.id, id)).returning()

    return ok(updated)
  } catch (err) {
    if (err instanceof Error && (err.message === 'Acceso denegado' || err.message === 'No autenticado')) {
      return unauthorized()
    }
    console.error('Error updating brand:', err)
    return serverError()
  }
}
