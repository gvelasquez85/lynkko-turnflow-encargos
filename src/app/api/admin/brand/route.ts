import { ok, badRequest, serverError, unauthorized } from '@lynkko/utils'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brands, establishments, users } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

// POST /api/admin/brand — Create brand during onboarding
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) return unauthorized()

    const body = await req.json()
    if (!body.name || !body.slug) {
      return badRequest('Nombre y slug son requeridos')
    }

    // Check if slug already exists
    const [existing] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, body.slug)).limit(1)
    if (existing) {
      return badRequest('El slug ya está en uso')
    }

    // Create brand
    const [brand] = await db.insert(brands).values({
      name: body.name,
      slug: body.slug,
      businessType: body.businessType || 'otros',
      active: true,
      currentPlan: 'free',
      activeModules: { mensajes: true, promotions: true },
      onboardingCompleted: false,
    }).returning()

    // Create default establishment
    const [establishment] = await db.insert(establishments).values({
      brandId: brand.id,
      name: 'Sucursal Principal',
      slug: `${body.slug}-principal`,
      active: true,
    }).returning()

    // Update user with brand and establishment
    await db.update(users).set({
      brandId: brand.id,
      establishmentId: establishment.id,
    }).where(eq(users.id, session.user.id))

    return ok({ brand, establishment })
  } catch (err) {
    console.error('Error creating brand:', err)
    return serverError()
  }
}
