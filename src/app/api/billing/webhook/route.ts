import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { billingTransactions, memberships } from '@/lib/db/schema'
import { eq } from '@lynkko/db'
import { verifyWompiWebhook } from '@/lib/wompi'
import { nextBillingDate } from '@/lib/billing-cop'

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const checksum = req.headers.get('x-event-checksum') ?? ''

  if (!verifyWompiWebhook(rawBody, checksum)) {
    console.warn('[billing/webhook] Firma inválida')
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (event.event !== 'transaction.updated') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const txnData = event.data?.transaction
  if (!txnData?.id || !txnData?.reference) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const wompiStatus: string = txnData.status
  const ourStatus = wompiStatus === 'APPROVED' ? 'approved'
    : wompiStatus === 'DECLINED' ? 'declined'
    : wompiStatus === 'VOIDED' ? 'voided'
    : wompiStatus === 'PENDING' ? 'pending'
    : 'error'

  const [txnRow] = await db
    .update(billingTransactions)
    .set({
      wompiTransactionId: txnData.id,
      status: ourStatus,
      errorReason: txnData.status_message ?? null,
    })
    .where(eq(billingTransactions.wompiReference, txnData.reference))
    .returning({ id: billingTransactions.id, brandId: billingTransactions.brandId, membershipId: billingTransactions.membershipId, amount: billingTransactions.amount })

  if (!txnRow) {
    return NextResponse.json({ ok: true, unknown_reference: true })
  }

  if (wompiStatus === 'APPROVED' && txnRow.membershipId) {
    const [membership] = await db
      .select({ billingAnchorDay: memberships.billingAnchorDay })
      .from(memberships)
      .where(eq(memberships.id, txnRow.membershipId))
      .limit(1)

    const anchorDay = membership?.billingAnchorDay ?? new Date().getDate()
    const now = new Date()
    const nextBilling = nextBillingDate(anchorDay, now)

    await db.update(memberships).set({
      billingStatus: 'active',
      lastBilledAt: now,
      lastBillingAmount: txnRow.amount,
      nextBillingAt: nextBilling,
      pastDueSince: null,
      pastDueAttempts: 0,
      pastDueLastAttemptAt: null,
    }).where(eq(memberships.id, txnRow.membershipId))
  }

  if (wompiStatus === 'DECLINED' || wompiStatus === 'ERROR') {
    console.warn(`[billing/webhook] Transacción ${txnData.id} ${wompiStatus} — brand ${txnRow.brandId}`)
  }

  return NextResponse.json({ ok: true })
}
