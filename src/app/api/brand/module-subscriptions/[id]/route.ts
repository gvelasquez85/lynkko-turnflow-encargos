import { NextRequest } from 'next/server'
import { getContext } from '@/lib/context'
import { ok, notFound, serverError } from '@lynkko/utils'
import { moduleSubscriptions } from '@/lib/db/schema'
import { and, eq } from '@lynkko/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, brandId } = await getContext()
    const body = await req.json()

    const [existing] = await db.select({ id: moduleSubscriptions.id })
      .from(moduleSubscriptions)
      .where(and(eq(moduleSubscriptions.id, id), eq(moduleSubscriptions.brandId, brandId)))
      .limit(1)

    if (!existing) return notFound()

    const [updated] = await db.update(moduleSubscriptions)
      .set({ status: body.status })
      .where(eq(moduleSubscriptions.id, id))
      .returning()

    return ok(updated)
  } catch {
    return serverError()
  }
}
