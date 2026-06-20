import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { memberships, moduleSubscriptions, billingTransactions, users } from '@/lib/db/schema'
import { eq, and, desc } from '@lynkko/db'
import { createPaymentSource, createTransaction } from '@/lib/wompi'
import {
  calcMonthlyTotalBilling, toCents, generateBillingReference, nextBillingDate, periodEnd,
  type BillingCurrency,
} from '@/lib/billing-cop'

export async function POST(req: NextRequest) {
  const { brandId, userId } = await getContext()

  const [currentUser] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!currentUser?.email) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { cardToken, acceptanceToken, personalDataToken, currency = 'COP', newEst, newAdv } = body as {
    cardToken: string
    acceptanceToken: string
    personalDataToken: string
    currency?: BillingCurrency
    newEst?: number
    newAdv?: number
  }

  if (!cardToken || !acceptanceToken || !personalDataToken)
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })

  const [membership] = await db
    .select({ id: memberships.id, maxEstablishments: memberships.maxEstablishments, maxAdvisors: memberships.maxAdvisors })
    .from(memberships)
    .where(eq(memberships.brandId, brandId))
    .orderBy(desc(memberships.createdAt))
    .limit(1)

  if (!membership)
    return NextResponse.json({ error: 'Sin membresía activa' }, { status: 404 })

  if (newEst && newAdv && (newEst !== membership.maxEstablishments || newAdv !== membership.maxAdvisors)) {
    await db
      .update(memberships)
      .set({ maxEstablishments: newEst, maxAdvisors: newAdv })
      .where(eq(memberships.id, membership.id))
    membership.maxEstablishments = newEst
    membership.maxAdvisors = newAdv
  }

  const modSubs = await db
    .select({ priceMonthly: moduleSubscriptions.priceMonthly })
    .from(moduleSubscriptions)
    .where(and(eq(moduleSubscriptions.brandId, brandId), eq(moduleSubscriptions.status, 'active')))

  const numPaidModules = modSubs.filter(m => Number(m.priceMonthly ?? 0) > 0).length

  const amount = calcMonthlyTotalBilling(
    membership.maxEstablishments ?? 1,
    membership.maxAdvisors ?? 2,
    numPaidModules,
    currency,
  )

  if (amount === 0)
    return NextResponse.json({ error: 'Plan gratuito no requiere medio de pago' }, { status: 400 })

  const amountCents = toCents(amount)
  const customerEmail = currentUser.email

  let paymentSource
  try {
    paymentSource = await createPaymentSource({ cardToken, customerEmail, acceptanceToken, personalDataToken })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al guardar la tarjeta'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const reference = generateBillingReference(brandId)
  const now = new Date()

  const [txn] = await db
    .insert(billingTransactions)
    .values({
      brandId,
      membershipId: membership.id,
      wompiReference: reference,
      amount: amountCents,
      currency,
      status: 'pending',
      paymentSourceId: paymentSource.id,
      customerEmail,
      periodStart: now.toISOString().slice(0, 10),
      periodEnd: periodEnd(nextBillingDate(now.getDate(), now)).toISOString().slice(0, 10),
    })
    .returning({ id: billingTransactions.id })

  let wompiTxn
  try {
    wompiTxn = await createTransaction({ paymentSourceId: paymentSource.id, amountCents, currency, reference, customerEmail })
  } catch (err: unknown) {
    await db
      .update(billingTransactions)
      .set({ status: 'error', errorReason: err instanceof Error ? err.message : 'error', wompiTransactionId: null })
      .where(eq(billingTransactions.id, txn.id))
    const msg = err instanceof Error ? err.message : 'El cobro fue rechazado'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const txnStatus = wompiTxn.status === 'APPROVED' ? 'approved'
    : wompiTxn.status === 'DECLINED' ? 'declined'
    : wompiTxn.status === 'PENDING' ? 'pending'
    : 'error'

  await db
    .update(billingTransactions)
    .set({ wompiTransactionId: wompiTxn.id, status: txnStatus, errorReason: wompiTxn.error?.reason ?? null })
    .where(eq(billingTransactions.id, txn.id))

  if (wompiTxn.status === 'DECLINED' || wompiTxn.status === 'ERROR') {
    return NextResponse.json({ error: wompiTxn.error?.reason ?? 'Tarjeta rechazada' }, { status: 422 })
  }

  const anchorDay = now.getDate()
  const nextBilling = nextBillingDate(anchorDay, now)

  await db
    .update(memberships)
    .set({
      plan: 'standard',
      wompiPaymentSourceId: String(paymentSource.id),
      wompiCustomerEmail: customerEmail,
      billingCurrency: currency,
      billingAnchorDay: anchorDay,
      lastBilledAt: now,
      lastBillingAmount: amountCents,
      nextBillingAt: nextBilling,
      billingStatus: 'active',
      pastDueAttempts: 0,
      pastDueSince: null,
    })
    .where(eq(memberships.id, membership.id))

  return NextResponse.json({
    ok: true,
    transactionStatus: wompiTxn.status,
    nextBillingAt: nextBilling.toISOString(),
    amountCents,
    currency,
  })
}
