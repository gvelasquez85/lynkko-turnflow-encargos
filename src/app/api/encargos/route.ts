import { ok, badRequest, serverError, unauthorized } from '@lynkko/utils'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargos } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

// POST /api/encargos — Create encargo
export async function POST(req: Request) {
  try {
    const ctx = await getContext()
    const body = await req.json()

    if (!body.itemDescription || !body.price) {
      return badRequest('Descripción y precio son requeridos')
    }

    const existing = await db.select().from(encargos).where(eq(encargos.brandId, ctx.brandId))
    const num = existing.length + 1
    const orderCode = `ENC-${String(num).padStart(3, '0')}`

    const now = new Date()
    const promisedDate = body.promisedDate || new Date(now.getTime() + 3 * 86400000)

    const [encargo] = await db.insert(encargos).values({
      brandId: ctx.brandId,
      establishmentId: ctx.establishmentId,
      customerId: body.customerId || null,
      orderCode,
      serviceId: body.serviceId || null,
      itemDescription: body.itemDescription,
      status: 'received',
      receivedAt: now,
      promisedDate: promisedDate.toISOString().split('T')[0],
      price: String(body.price),
      paid: false,
      notifyWhatsapp: body.notifyWhatsapp ? true : false,
      advisorId: ctx.userId,
      createdAt: now,
      updatedAt: now,
    } as any).returning()

    if (!encargo) {
      return serverError()
    }

    return ok(encargo)
  } catch (err) {
    if (err instanceof Error && err.message === 'No autenticado') return unauthorized()
    console.error('Error creating encargo:', err)
    return serverError()
  }
}
