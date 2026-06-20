import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { memberships, moduleSubscriptions, billingTransactions, brands, users } from '@/lib/db/schema'
import { eq, desc } from '@lynkko/db'
import { createPaymentSource, createTransaction } from '@/lib/wompi'
import { toCents, generateBillingReference, nextBillingDate, periodEnd, type BillingCurrency } from '@/lib/billing-cop'

export async function POST(req: NextRequest) {
  const { brandId, userId } = await getContext()

  const [currentUser] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const customerEmail = currentUser?.email ?? ''

  const body = await req.json() as {
    moduleKey: string
    priceMonthly: number
    cardToken?: string
    acceptanceToken?: string
    personalDataToken?: string
    useStoredCard?: boolean
    currency?: BillingCurrency
  }

  const { moduleKey, priceMonthly, currency = 'COP', useStoredCard } = body

  if (!moduleKey || !priceMonthly)
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })

  const [membership] = await db
    .select({
      id: memberships.id,
      wompiPaymentSourceId: memberships.wompiPaymentSourceId,
      wompiCustomerEmail: memberships.wompiCustomerEmail,
      billingAnchorDay: memberships.billingAnchorDay,
    })
    .from(memberships)
    .where(eq(memberships.brandId, brandId))
    .orderBy(desc(memberships.createdAt))
    .limit(1)

  let paymentSourceId: number

  if (useStoredCard) {
    if (!membership?.wompiPaymentSourceId)
      return NextResponse.json({ error: 'No hay tarjeta guardada. Ingresa una nueva.' }, { status: 400 })
    paymentSourceId = Number(membership.wompiPaymentSourceId)
  } else {
    const { cardToken, acceptanceToken, personalDataToken } = body
    if (!cardToken || !acceptanceToken || !personalDataToken)
      return NextResponse.json({ error: 'Faltan datos de tarjeta' }, { status: 400 })

    let src
    try {
      src = await createPaymentSource({ cardToken, customerEmail, acceptanceToken, personalDataToken })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la tarjeta'
      return NextResponse.json({ error: msg }, { status: 422 })
    }
    paymentSourceId = src.id

    if (membership && !membership.wompiPaymentSourceId) {
      await db.update(memberships).set({
        wompiPaymentSourceId: String(src.id),
        wompiCustomerEmail: customerEmail,
      }).where(eq(memberships.id, membership.id))
    }
  }

  const amountCents = toCents(priceMonthly)
  const reference = generateBillingReference(brandId)
  const now = new Date()

  const [txn] = await db.insert(billingTransactions).values({
    brandId,
    membershipId: membership?.id ?? null,
    wompiReference: reference,
    amount: amountCents,
    currency,
    status: 'pending',
    paymentSourceId,
    customerEmail,
    periodStart: now.toISOString().slice(0, 10),
    periodEnd: periodEnd(nextBillingDate(now.getDate(), now)).toISOString().slice(0, 10),
  }).returning({ id: billingTransactions.id })

  let wompiTxn
  try {
    wompiTxn = await createTransaction({ paymentSourceId, amountCents, currency, reference, customerEmail })
  } catch (err) {
    await db.update(billingTransactions)
      .set({ status: 'error', errorReason: err instanceof Error ? err.message : 'error' })
      .where(eq(billingTransactions.id, txn.id))
    const msg = err instanceof Error ? err.message : 'El cobro fue rechazado'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const txnStatus = wompiTxn.status === 'APPROVED' ? 'approved'
    : wompiTxn.status === 'DECLINED' ? 'declined'
    : wompiTxn.status === 'PENDING' ? 'pending'
    : 'error'

  await db.update(billingTransactions)
    .set({ wompiTransactionId: wompiTxn.id, status: txnStatus, errorReason: wompiTxn.error?.reason ?? null })
    .where(eq(billingTransactions.id, txn.id))

  if (wompiTxn.status === 'DECLINED' || wompiTxn.status === 'ERROR')
    return NextResponse.json({ error: wompiTxn.error?.reason ?? 'Tarjeta rechazada' }, { status: 422 })

  const anchorDay = membership?.billingAnchorDay ?? now.getDate()
  const expiresAt = nextBillingDate(anchorDay, now).toISOString()

  const [sub] = await db.insert(moduleSubscriptions).values({
    brandId,
    moduleKey,
    status: 'active',
    activatedAt: now,
    expiresAt: new Date(expiresAt),
    priceMonthly: String(priceMonthly),
    trialStartedAt: now,
    trialExpiresAt: null,
  }).onConflictDoUpdate({
    target: [moduleSubscriptions.brandId, moduleSubscriptions.moduleKey],
    set: {
      status: 'active',
      activatedAt: now,
      expiresAt: new Date(expiresAt),
      priceMonthly: String(priceMonthly),
    },
  }).returning()

  const [brandData] = await db.select({ activeModules: brands.activeModules }).from(brands).where(eq(brands.id, brandId)).limit(1)
  const activeModules = { ...((brandData?.activeModules as Record<string, boolean>) ?? {}), [moduleKey]: true }
  await db.update(brands).set({ activeModules }).where(eq(brands.id, brandId))

  return NextResponse.json({ ok: true, expiresAt, sub, transactionStatus: wompiTxn.status })
}
