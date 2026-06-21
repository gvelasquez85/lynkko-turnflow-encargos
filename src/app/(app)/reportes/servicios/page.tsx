import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encargos, customers, encargoServices } from '@/lib/db/schema'
import { eq, desc, count, sum, gte } from '@lynkko/db'
import { getContext } from '@/lib/context'
import { subDays } from 'date-fns'

export default async function ReportesServiciosPage() {
  const ctx = await getContext()
  const thirtyDaysAgo = subDays(new Date(), 30)

  // Get all encargos with status breakdown
  const allEncargos = await db
    .select({
      id: encargos.id,
      orderCode: encargos.orderCode,
      status: encargos.status,
      price: encargos.price,
      createdAt: encargos.createdAt,
      promisedDate: encargos.promisedDate,
      customerName: customers.name,
      serviceName: encargoServices.name,
    })
    .from(encargos)
    .leftJoin(customers, eq(customers.id, encargos.customerId))
    .leftJoin(encargoServices, eq(encargoServices.id, encargos.serviceId))
    .where(eq(encargos.brandId, ctx.brandId))
    .orderBy(desc(encargos.createdAt))

  // Status breakdown
  const statusCounts = {
    received: allEncargos.filter(e => e.status === 'received').length,
    in_progress: allEncargos.filter(e => e.status === 'in_progress').length,
    ready: allEncargos.filter(e => e.status === 'ready').length,
    delivered: allEncargos.filter(e => e.status === 'delivered').length,
    cancelled: allEncargos.filter(e => e.status === 'cancelled').length,
  }

  const totalRevenue = allEncargos
    .filter(e => e.status === 'delivered' || e.status === 'ready')
    .reduce((sum, e) => sum + parseFloat(e.price || '0'), 0)

  const recentEncargos = allEncargos.filter(e => 
    e.createdAt && new Date(e.createdAt) >= thirtyDaysAgo
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reportes de Servicios</h1>
      <p className="text-sm text-gray-500 mb-6">Métricas de encargos por estado</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Total encargos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{allEncargos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Últimos 30 días</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{recentEncargos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Ingresos estimados</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            ${totalRevenue.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Pendientes</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">
            {statusCounts.received + statusCounts.in_progress}
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Por estado</h2>
        <div className="space-y-3">
          {[
            { key: 'received', label: 'Recibidos', count: statusCounts.received, color: 'bg-blue-500' },
            { key: 'in_progress', label: 'En proceso', count: statusCounts.in_progress, color: 'bg-amber-500' },
            { key: 'ready', label: 'Listos', count: statusCounts.ready, color: 'bg-green-500' },
            { key: 'delivered', label: 'Entregados', count: statusCounts.delivered, color: 'bg-purple-500' },
            { key: 'cancelled', label: 'Cancelados', count: statusCounts.cancelled, color: 'bg-red-500' },
          ].map(item => {
            const pct = allEncargos.length > 0 ? (item.count / allEncargos.length) * 100 : 0
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-gray-500">{item.count} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent encargos table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Encargos recientes</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Servicio</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {allEncargos.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin encargos</td></tr>
            ) : (
              allEncargos.slice(0, 20).map(encargo => (
                <tr key={encargo.id} className="border-b border-gray-50">
                  <td className="px-5 py-3 text-sm font-mono text-gray-500">{encargo.orderCode}</td>
                  <td className="px-5 py-3 text-sm text-gray-900">{encargo.serviceName || 'N/A'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{encargo.customerName || 'N/A'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      encargo.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                      encargo.status === 'ready' ? 'bg-green-100 text-green-700' :
                      encargo.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                      encargo.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {encargo.status === 'delivered' ? 'Entregado' :
                       encargo.status === 'ready' ? 'Listo' :
                       encargo.status === 'in_progress' ? 'En proceso' :
                       encargo.status === 'cancelled' ? 'Cancelado' : 'Recibido'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    ${parseFloat(encargo.price || '0').toLocaleString('es-CO')}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {encargo.createdAt ? new Date(encargo.createdAt).toLocaleDateString('es-CO') : 'N/A'}
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
