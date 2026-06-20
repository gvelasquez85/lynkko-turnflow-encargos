import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brands, memberships, billingTransactions } from '@/lib/db/schema'
import { eq, desc, sum, count, gte } from '@lynkko/db'
import { subDays } from 'date-fns'

export default async function SuperadminBillingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string }
  if (user.role !== 'superadmin') redirect('/dashboard')

  const thirtyDaysAgo = subDays(new Date(), 30)

  // Revenue stats
  const [totalRevenue] = await db
    .select({ total: sum(billingTransactions.amount) })
    .from(billingTransactions)
    .where(eq(billingTransactions.status, 'APPROVED'))

  const [monthlyRevenue] = await db
    .select({ total: sum(billingTransactions.amount) })
    .from(billingTransactions)
    .where(gte(billingTransactions.createdAt, thirtyDaysAgo))

  // Recent transactions
  const recentTransactions = await db
    .select({
      id: billingTransactions.id,
      amount: billingTransactions.amount,
      status: billingTransactions.status,
      createdAt: billingTransactions.createdAt,
      brandName: brands.name,
    })
    .from(billingTransactions)
    .leftJoin(brands, eq(brands.id, billingTransactions.brandId))
    .orderBy(desc(billingTransactions.createdAt))
    .limit(20)

  // Membership stats
  const [activeMemberships] = await db
    .select({ count: count() })
    .from(memberships)
    .where(eq(memberships.status, 'active'))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing</h1>
      <p className="text-sm text-gray-500 mb-6">Gestión de facturación y suscripciones</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Ingresos totales</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            ${Number(totalRevenue.total ?? 0).toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Ingresos últimos 30 días</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">
            ${Number(monthlyRevenue.total ?? 0).toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Membresías activas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeMemberships.count}</p>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Transacciones recientes</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Marca</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Monto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Sin transacciones</td></tr>
            ) : (
              recentTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{tx.brandName || 'N/A'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">${Number(tx.amount).toLocaleString('es-CO')}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
