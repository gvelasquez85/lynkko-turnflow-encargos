import { ok, badRequest, notFound, serverError, unauthorized } from '@lynkko/utils'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargoServices } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

// POST /api/admin/servicios — Create service
export async function POST(req: Request) {
  try {
    const ctx = await getContext()
    const body = await req.json()

    if (!body.name || !body.price) {
      return badRequest('Nombre y precio son requeridos')
    }

    const [service] = await db.insert(encargoServices).values({
      brandId: ctx.brandId,
      name: body.name,
      description: body.description || null,
      price: body.price.toString(),
      durationDays: body.durationDays || 3,
      isActive: true,
      sortOrder: 0,
    }).returning()

    return ok(service)
  } catch (err) {
    if (err instanceof Error && err.message === 'No autenticado') return unauthorized()
    console.error('Error creating service:', err)
    return serverError()
  }
}

// PATCH /api/admin/servicios/[id] — Update service
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getContext()
    const { id } = await params
    const body = await req.json()

    const [existing] = await db.select().from(encargoServices)
      .where(and(eq(encargoServices.id, id), eq(encargoServices.brandId, ctx.brandId)))
      .limit(1)

    if (!existing) return notFound('Servicio no encontrado')

    const [updated] = await db.update(encargoServices)
      .set({
        name: body.name || existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        price: body.price?.toString() || existing.price,
        durationDays: body.durationDays || existing.durationDays,
      })
      .where(eq(encargoServices.id, id))
      .returning()

    return ok(updated)
  } catch (err) {
    if (err instanceof Error && err.message === 'No autenticado') return unauthorized()
    console.error('Error updating service:', err)
    return serverError()
  }
}

// DELETE /api/admin/servicios/[id] — Delete service
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getContext()
    const { id } = await params

    const [existing] = await db.select().from(encargoServices)
      .where(and(eq(encargoServices.id, id), eq(encargoServices.brandId, ctx.brandId)))
      .limit(1)

    if (!existing) return notFound('Servicio no encontrado')

    await db.delete(encargoServices).where(eq(encargoServices.id, id))

    return ok({ deleted: true })
  } catch (err) {
    if (err instanceof Error && err.message === 'No autenticado') return unauthorized()
    console.error('Error deleting service:', err)
    return serverError()
  }
}
