import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { moduleSubscriptions, brands } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

export async function POST(req: NextRequest) {
  try {
    const { db, brandId } = await getContext()

    const body = await req.json().catch(() => null)
    if (!body?.moduleKey) return NextResponse.json({ error: 'moduleKey requerido' }, { status: 400 })

    const { moduleKey, isFree } = body
    const now = new Date()
    const trialExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const [sub] = await db.insert(moduleSubscriptions).values({
      brandId,
      moduleKey,
      status: isFree ? 'active' : 'trial',
      trialStartedAt: now,
      trialExpiresAt: isFree ? null : trialExpires,
      activatedAt: isFree ? now : null,
      expiresAt: null,
    }).onConflictDoUpdate({
      target: [moduleSubscriptions.brandId, moduleSubscriptions.moduleKey],
      set: {
        status: isFree ? 'active' : 'trial',
        trialStartedAt: now,
        trialExpiresAt: isFree ? null : trialExpires,
        activatedAt: isFree ? now : null,
      },
    }).returning()

    const [brand] = await db.select({ activeModules: brands.activeModules })
      .from(brands).where(eq(brands.id, brandId)).limit(1)

    const updated = { ...((brand?.activeModules as Record<string, boolean>) ?? {}), [moduleKey]: true }
    await db.update(brands).set({ activeModules: updated }).where(eq(brands.id, brandId))

    return NextResponse.json({ data: sub, activeModules: updated })
  } catch {
    return NextResponse.json({ error: 'Error al activar prueba' }, { status: 500 })
  }
}
