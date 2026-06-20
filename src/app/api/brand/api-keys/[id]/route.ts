import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db
    .update(apiKeys)
    .set({ active: false })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.brandId, brandId)))

  return NextResponse.json({ success: true })
}
