import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { webhookEndpoints } from '@/lib/db/schema'
import { eq } from '@lynkko/db'
import crypto from 'crypto'

const EVENTS = ['ticket.created', 'ticket.attended', 'ticket.done', 'ticket.cancelled']

export async function GET() {
  const { brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db
    .select({ id: webhookEndpoints.id, url: webhookEndpoints.url, events: webhookEndpoints.events, active: webhookEndpoints.active })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.brandId, brandId))

  const map = Object.fromEntries(EVENTS.map(e => [e, { id: null as string | null, url: '', active: false }]))
  for (const row of rows) {
    for (const event of (row.events ?? [])) {
      if (EVENTS.includes(event)) {
        map[event] = { id: row.id, url: row.url, active: row.active }
      }
    }
  }

  return NextResponse.json({ data: map })
}

export async function PUT(req: NextRequest) {
  const { brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: Record<string, string> = await req.json().catch(() => ({}))

  for (const event of EVENTS) {
    const url = (body[event] ?? '').trim()
    if (url) {
      try { new URL(url) } catch {
        return NextResponse.json({ error: `Invalid URL for event ${event}: ${url}` }, { status: 400 })
      }
    }
  }

  // Delete all existing rows, then rebuild grouped by URL
  await db.delete(webhookEndpoints).where(eq(webhookEndpoints.brandId, brandId))

  const urlToEvents: Record<string, string[]> = {}
  for (const event of EVENTS) {
    const url = (body[event] ?? '').trim()
    if (url) {
      if (!urlToEvents[url]) urlToEvents[url] = []
      urlToEvents[url].push(event)
    }
  }

  for (const [url, events] of Object.entries(urlToEvents)) {
    await db.insert(webhookEndpoints).values({
      brandId,
      name: 'Mi webhook',
      url,
      secret: crypto.randomBytes(24).toString('hex'),
      events,
      active: true,
    })
  }

  return NextResponse.json({ success: true })
}
