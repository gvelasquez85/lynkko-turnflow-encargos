import { ok, unauthorized, serverError } from '@lynkko/utils'
import { getSuperadminContext } from '@/lib/context'
import { db } from '@/lib/db'
import { brands } from '@/lib/db/schema'
import { desc } from '@lynkko/db'

// GET /api/superadmin/brands — List all brands
export async function GET() {
  try {
    await getSuperadminContext()

    const brandsList = await db.query.brands.findMany({
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    })

    return ok({ brands: brandsList })
  } catch (err) {
    if (err instanceof Error && (err.message === 'Acceso denegado' || err.message === 'No autenticado')) {
      return unauthorized()
    }
    console.error('Error fetching brands:', err)
    return serverError()
  }
}
