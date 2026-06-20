import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import {
  brands, memberships, moduleSubscriptions, marketplaceModules,
  establishments, users, customers, products, sales,
} from '@/lib/db/schema'
import { and, eq, gte, count, ne, desc } from '@lynkko/db'
import { BrandSettings } from './BrandSettings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi marca' }
export const dynamic = 'force-dynamic'

export default async function MarcaPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string }
  if (!['brand_admin', 'manager', 'superadmin'].includes(user.role ?? '')) redirect('/configuracion')

  const { db, brandId } = await getContext()

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [
    brand,
    membership,
    moduleSubs,
    availableMods,
    [estCount],
    [userCount],
    [clientCount],
    [productCount],
    [salesCount],
  ] = await Promise.all([
    db.select().from(brands).where(eq(brands.id, brandId)).then(r => r[0] ?? null),

    db.select().from(memberships)
      .where(eq(memberships.brandId, brandId))
      .orderBy(desc(memberships.createdAt))
      .limit(1)
      .then(r => r[0] ?? null),

    db.select({
      id: moduleSubscriptions.id,
      moduleKey: moduleSubscriptions.moduleKey,
      status: moduleSubscriptions.status,
      trialExpiresAt: moduleSubscriptions.trialExpiresAt,
      priceMonthly: moduleSubscriptions.priceMonthly,
    })
      .from(moduleSubscriptions)
      .where(eq(moduleSubscriptions.brandId, brandId))
      .orderBy(desc(moduleSubscriptions.createdAt)),

    db.select({
      moduleKey: marketplaceModules.moduleKey,
      label: marketplaceModules.label,
      priceMonthly: marketplaceModules.priceMonthly,
      pricePerUser: marketplaceModules.pricePerUser,
      pricePerUserAmount: marketplaceModules.pricePerUserAmount,
    }).from(marketplaceModules),

    db.select({ value: count() }).from(establishments).where(and(eq(establishments.brandId, brandId), eq(establishments.active, true))),
    db.select({ value: count() }).from(users).where(eq((users as any).brandId, brandId)),
    db.select({ value: count() }).from(customers).where(eq(customers.brandId, brandId)),
    db.select({ value: count() }).from(products).where(and(eq(products.brandId, brandId), eq(products.active, true))),
    db.select({ value: count() }).from(sales).where(and(
      eq(sales.brandId, brandId),
      eq(sales.type, 'sale'),
      ne(sales.status, 'cancelled'),
      gte(sales.createdAt, firstOfMonth),
    )),
  ])

  if (!brand) redirect('/configuracion')

  return (
    <BrandSettings
      brand={{
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl ?? null,
        primaryColor: brand.primaryColor ?? null,
        secondaryColor: (brand as any).secondaryColor ?? null,
        fontColor: (brand as any).fontColor ?? null,
        address: brand.address ?? null,
        contactEmail: brand.contactEmail ?? null,
        website: brand.website ?? null,
        language: (brand as any).language ?? null,
        country: brand.country ?? null,
        businessType: brand.businessType ?? null,
        activeModules: (brand as any).activeModules ?? null,
      }}
      membership={membership ? {
        id: membership.id,
        plan: membership.plan,
        status: membership.status,
        startedAt: membership.startedAt.toISOString(),
        expiresAt: membership.expiresAt?.toISOString() ?? null,
        maxEstablishments: membership.maxEstablishments ?? 1,
        maxAdvisors: membership.maxAdvisors ?? 3,
        wompiPaymentSourceId: membership.wompiPaymentSourceId ?? null,
        wompiCustomerEmail: membership.wompiCustomerEmail ?? null,
        billingCurrency: (membership.billingCurrency as any) ?? 'COP',
        billingAnchorDay: membership.billingAnchorDay ?? null,
        billingStatus: (membership.billingStatus as any) ?? null,
        nextBillingAt: membership.nextBillingAt?.toISOString() ?? null,
        lastBilledAt: membership.lastBilledAt?.toISOString() ?? null,
        lastBillingAmount: membership.lastBillingAmount ?? null,
        pastDueSince: membership.pastDueSince?.toISOString() ?? null,
        pastDueAttempts: membership.pastDueAttempts ?? null,
      } : null}
      moduleSubscriptions={moduleSubs.map(s => ({
        id: s.id,
        moduleKey: s.moduleKey,
        status: s.status,
        trialExpiresAt: s.trialExpiresAt?.toISOString() ?? null,
        priceMonthly: s.priceMonthly ? Number(s.priceMonthly) : null,
      }))}
      availableModules={availableMods.map(m => ({
        moduleKey: m.moduleKey,
        label: m.label,
        priceMonthly: Number(m.priceMonthly ?? 0),
        pricePerUser: m.pricePerUser ?? false,
        pricePerUserAmount: Number(m.pricePerUserAmount ?? 0),
      }))}
      currentEstablishments={estCount?.value ?? 1}
      currentAdvisors={userCount?.value ?? 0}
      currentClients={clientCount?.value ?? 0}
      currentProducts={productCount?.value ?? 0}
      currentSalesThisMonth={salesCount?.value ?? 0}
      isSuperAdmin={user.role === 'superadmin'}
    />
  )
}
