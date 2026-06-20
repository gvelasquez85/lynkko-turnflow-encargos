import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargoServices } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

export async function POST(req: NextRequest) {
  const { brandId } = await getContext()

  const body = await req.json().catch(() => ({}))
  const { name, price, durationDays, description, sortOrder } = body as {
    name: string
    price: number
    durationDays?: number
    description?: string | null
    sortOrder?: number
  }

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const [service] = await db
    .insert(encargoServices)
    .values({
      brandId,
      name,
      price:       String(price),
      durationDays: durationDays ?? 3,
      description:  description ?? null,
      sortOrder:    sortOrder ?? 0,
      isActive:     true,
    })
    .returning()

  return NextResponse.json({ service: { ...service, price: Number(service.price ?? 0) } }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { brandId } = await getContext()

  const body = await req.json().catch(() => ({}))
  const { id, isActive } = body as { id: string; isActive: boolean }

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  await db
    .update(encargoServices)
    .set({ isActive })
    .where(and(eq(encargoServices.id, id), eq(encargoServices.brandId, brandId)))

  return NextResponse.json({ ok: true })
}
