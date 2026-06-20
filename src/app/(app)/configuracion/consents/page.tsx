import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import { dataConsents, establishments, tickets } from '@/lib/db/schema'
import { eq, desc } from '@lynkko/db'
import { ConsentsManager } from './ConsentsManager'

export const dynamic = 'force-dynamic'

export default async function ConsentsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { db, brandId } = await getContext()

  const rows = await db
    .select({
      id: dataConsents.id,
      ticketId: dataConsents.ticketId,
      establishmentId: dataConsents.establishmentId,
      brandId: dataConsents.brandId,
      customerName: dataConsents.customerName,
      customerPhone: dataConsents.customerPhone,
      customerEmail: dataConsents.customerEmail,
      marketingOptIn: dataConsents.marketingOptIn,
      dataProcessingConsent: dataConsents.dataProcessingConsent,
      consentedAt: dataConsents.consentedAt,
      establishmentName: establishments.name,
      ticketQueueNumber: tickets.queueNumber,
    })
    .from(dataConsents)
    .leftJoin(establishments, eq(dataConsents.establishmentId, establishments.id))
    .leftJoin(tickets, eq(dataConsents.ticketId, tickets.id))
    .where(eq(dataConsents.brandId, brandId))
    .orderBy(desc(dataConsents.consentedAt))
    .limit(500)

  return (
    <ConsentsManager
      consents={rows.map(r => ({
        ...r,
        brandId: r.brandId ?? brandId,
        consentedAt: r.consentedAt.toISOString(),
      }))}
    />
  )
}
