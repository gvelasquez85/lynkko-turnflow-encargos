import { ok, serverError, unauthorized } from '@lynkko/utils'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargoServices } from '@/lib/db/schema'
import { eq, asc } from '@lynkko/db'

// GET /api/admin/servicios — List all services for current brand
export async function GET() {
  try {
    const ctx = await getContext()

    const services = await db
      .select()
      .from(encargoServices)
      .where(eq(encargoServices.brandId, ctx.brandId))
      .orderBy(asc(encargoServices.sortOrder))

    return ok(services)
  } catch (err) {
    if (err instanceof Error && err.message === 'No autenticado') return unauthorized()
    console.error('Error fetching services:', err)
    return serverError()
  }
}
