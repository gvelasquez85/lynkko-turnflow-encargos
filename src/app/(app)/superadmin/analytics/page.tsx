import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brands, users, encargos, sales } from '@/lib/db/schema'
import { eq, desc, count, sum, gte } from '@lynkko/db'
import { subDays } from 'date-fns'

export default async function SuperadminAnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string }
  if (user.role !== 'superadmin') redirect('/dashboard')

  const thirtyDaysAgo = subDays(new Date(), 30)

  // Aggregate stats
  const [totalBrands] = await db.select({ count: count() }).from(brands)
  const [activeBrands] = await db.select({ count: count() }).from(brands).where(eq(brands.active, true))
  const [totalUsers] = await db.select({ count: count() }).from(users).where(eq(users.active, true))
  const [totalEncargos] = await db.select({ count: count() }).from(encargos)
  const [recentEncargos] = await db.select({ count: count() }).from(encargos).where(gte(encargos.createdAt, thirtyDaysAgo))
  const [totalSales] = await db.select({ total: sum(sales.total) }).from(sales).where(eq(sales.status, 'completed'))

  // Plan distribution
  const planDistribution = await db
    .select({ plan: brands.currentPlan, count: count() })
    .from(brands)
    .groupBy(brands.currentPlan)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">Métricas generales de la plataforma Encargos</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Marcas totales</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalBrands.count}</p>
          <p className="text-xs text-green-600 mt-1">{activeBrands.count} activas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Usuarios activos</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{totalUsers.count}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Encargos totales</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalEncargos.count}</p>
          <p className="text-xs text-green-600 mt-1">{recentEncargos.count} en últimos 30 días</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Ventas totales</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            ${Number(totalSales.total ?? 0).toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Plan distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por plan</h2>
        <div className="space-y-3">
          {planDistribution.map(({ plan, count: planCount }) => {
            const pct = totalBrands.count > 0 ? (planCount / totalBrands.count) * 100 : 0
            return (
              <div key={plan}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 capitalize">{plan}</span>
                  <span className="text-gray-500">{planCount} marcas ({pct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
