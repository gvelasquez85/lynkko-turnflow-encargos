import { ok, badRequest, notFound, serverError, unauthorized } from '@lynkko/utils'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargos } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

// PATCH /api/encargos/[id]/status — Update encargo status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getContext()
    const { id } = await params
    const body = await req.json()

    if (!body.status) {
      return badRequest('Estado es requerido')
    }

    const validStatuses = ['received', 'in_progress', 'ready', 'delivered', 'cancelled']
    if (!validStatuses.includes(body.status)) {
      return badRequest('Estado inválido')
    }

    const [existing] = await db.select().from(encargos)
      .where(and(eq(encargos.id, id), eq(encargos.brandId, ctx.brandId)))
      .limit(1)

    if (!existing) return notFound('Encargo no encontrado')

    const [updated] = await db.update(encargos)
      .set({ status: body.status })
      .where(eq(encargos.id, id))
      .returning()

    return ok(updated)
  } catch (err) {
    if (err instanceof Error && err.message === 'No autenticado') return unauthorized()
    console.error('Error updating encargo status:', err)
    return serverError()
  }
}
