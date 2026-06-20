import { db } from '@/lib/db'
import { webhookEndpoints } from '@/lib/db/schema'
import { and, eq } from '@lynkko/db'

export type WebhookEvent = 'ticket.created' | 'ticket.attended' | 'ticket.done' | 'ticket.cancelled'

interface TicketPayload {
  ticket_id: string
  queue_number: string
  customer_name: string
  status: string
  establishment_id: string
  establishment_name?: string
  visit_reason?: string
  created_at: string
  attended_at?: string | null
}

export async function dispatchWebhooks(
  brandId: string,
  event: WebhookEvent,
  ticket: TicketPayload,
): Promise<void> {
  const endpoints = await db
    .select({ id: webhookEndpoints.id, url: webhookEndpoints.url, events: webhookEndpoints.events })
    .from(webhookEndpoints)
    .where(and(eq(webhookEndpoints.brandId, brandId), eq(webhookEndpoints.active, true)))

  const active = endpoints.filter(ep => ep.events?.includes(event))
  if (!active.length) return

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    brand_id: brandId,
    data: ticket,
  })

  await Promise.allSettled(
    active.map(ep =>
      fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(8000),
      }).catch(() => null),
    ),
  )
}
