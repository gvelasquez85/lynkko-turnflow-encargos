import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import {
  brands, sales, customers, products, appointments,
  establishments, moduleSubscriptions,
} from '@/lib/db/schema'
import { and, eq, ne, gte, lt, isNotNull, asc, desc, count, lte, inArray } from '@lynkko/db'
import { HomePanel } from './HomePanel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { name: string; role?: string }
  const { db, brandId } = await getContext()

  const since48h = new Date(Date.now() - 48  * 3600000)
  const since7d  = new Date(Date.now() - 7   * 86400000)
  const since30d = new Date(Date.now() - 30  * 86400000)
  const since2d  = new Date(Date.now() - 2   * 86400000)

  const [
    brand,
    salesRecent,
    salesWeek,
    inactiveClients,
    openQuotes,
    lowStock,
    [clientCountRow],
    birthdayClients,
    apptSub,
  ] = await Promise.all([
    db.select({ name: brands.name, businessType: brands.businessType, primaryColor: brands.primaryColor })
      .from(brands).where(eq(brands.id, brandId)).then(r => r[0] ?? null),

    db.select({ id: sales.id, total: sales.total, status: sales.status, createdAt: sales.createdAt })
      .from(sales)
      .where(and(eq(sales.brandId, brandId), eq(sales.type, 'sale'), ne(sales.status, 'cancelled'), gte(sales.createdAt, since48h))),

    db.select({ id: sales.id, total: sales.total, status: sales.status, createdAt: sales.createdAt })
      .from(sales)
      .where(and(eq(sales.brandId, brandId), eq(sales.type, 'sale'), ne(sales.status, 'cancelled'), gte(sales.createdAt, since7d))),

    db.select({ id: customers.id, name: customers.name, phone: customers.phone, lastVisitAt: customers.lastVisitAt })
      .from(customers)
      .where(and(eq(customers.brandId, brandId), lt(customers.lastVisitAt, since30d), isNotNull(customers.phone)))
      .orderBy(asc(customers.lastVisitAt))
      .limit(10),

    db.select({ id: sales.id, total: sales.total, createdAt: sales.createdAt, customerName: customers.name })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(and(
        eq(sales.brandId, brandId),
        eq(sales.type, 'quote'),
        inArray(sales.status, ['draft', 'sent']),
        lt(sales.createdAt, since2d),
      ))
      .orderBy(asc(sales.createdAt))
      .limit(8),

    db.select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(and(eq(products.brandId, brandId), eq(products.active, true), lte(products.stock, 5)))
      .orderBy(asc(products.stock))
      .limit(5),

    db.select({ value: count() }).from(customers).where(eq(customers.brandId, brandId)),

    db.select({ id: customers.id, name: customers.name, phone: customers.phone, cumpleanos: (customers as any).cumpleanos })
      .from(customers)
      .where(and(eq(customers.brandId, brandId), isNotNull((customers as any).cumpleanos)))
      .orderBy(asc(customers.name)),

    db.select({ status: moduleSubscriptions.status })
      .from(moduleSubscriptions)
      .where(and(
        eq(moduleSubscriptions.brandId, brandId),
        eq(moduleSubscriptions.moduleKey, 'appointments'),
        inArray(moduleSubscriptions.status, ['active', 'trial']),
      ))
      .limit(1)
      .then(r => r[0] ?? null),
  ])

  const hasAppointments = !!apptSub
  let appointmentList: { id: string; status: string; scheduledAt: string; customerName: string }[] = []

  if (hasAppointments) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7)

    const estList = await db.select({ id: establishments.id })
      .from(establishments)
      .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true)))

    const estIds = estList.map(e => e.id)

    if (estIds.length > 0) {
      const appts = await db.select({
        id: appointments.id,
        status: appointments.status,
        scheduledAt: appointments.scheduledAt,
        customerName: appointments.customerName,
      })
        .from(appointments)
        .where(and(
          inArray(appointments.establishmentId, estIds),
          gte(appointments.scheduledAt, todayStart),
          lte(appointments.scheduledAt, weekEnd),
        ))
        .orderBy(asc(appointments.scheduledAt))
      appointmentList = appts.map(a => ({
        id: a.id,
        status: a.status,
        scheduledAt: a.scheduledAt.toISOString(),
        customerName: a.customerName,
      }))
    }
  }

  return (
    <HomePanel
      brandName={brand?.name ?? ''}
      businessType={brand?.businessType ?? 'otros'}
      userName={user.name}
      salesRecent={salesRecent.map(s => ({ id: s.id, total: Number(s.total), status: s.status, createdAt: s.createdAt.toISOString() }))}
      salesWeek={salesWeek.map(s => ({ id: s.id, total: Number(s.total), status: s.status, createdAt: s.createdAt.toISOString() }))}
      totalClients={clientCountRow?.value ?? 0}
      inactiveClients={inactiveClients.map(c => ({ id: c.id, name: c.name, phone: c.phone, updatedAt: c.lastVisitAt.toISOString() }))}
      openQuotes={openQuotes.map(q => ({ id: q.id, total: Number(q.total), createdAt: q.createdAt.toISOString(), customerName: q.customerName }))}
      lowStock={lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock ?? 0 }))}
      hasAppointments={hasAppointments}
      appointments={appointmentList}
      birthdayClients={birthdayClients.map(c => ({ id: c.id, name: c.name, phone: c.phone, cumpleanos: c.cumpleanos ?? '' }))}
    />
  )
}
