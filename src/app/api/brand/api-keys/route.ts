import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq, desc } from '@lynkko/db'
import crypto from 'crypto'

function generateKey(): { full: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(24).toString('hex')
  const full = `ta_${random}`
  const prefix = full.slice(0, 16)
  const hash = crypto.createHash('sha256').update(full).digest('hex')
  return { full, prefix, hash }
}

export async function GET() {
  const { brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      active: apiKeys.active,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.brandId, brandId))
    .orderBy(desc(apiKeys.createdAt))

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const name = (body.name as string)?.trim() || 'Clave principal'

  const { full, prefix, hash } = generateKey()

  const [data] = await db
    .insert(apiKeys)
    .values({ brandId, name, keyPrefix: prefix, keyHash: hash, active: true })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      active: apiKeys.active,
      createdAt: apiKeys.createdAt,
    })

  return NextResponse.json({ data: { ...data, full_key: full } }, { status: 201 })
}
