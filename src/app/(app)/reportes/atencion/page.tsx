import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getContext } from '@/lib/context'
import { tickets, establishments, attentions } from '@/lib/db/schema'
import { and, eq, desc, gte } from '@lynkko/db'

export const dynamic = 'force-dynamic'

export default async function ReporteAtencionPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { db, brandId } = await getContext()

  const since30 = new Date(Date.now() - 30 * 86400000)

  const [estList, ticketList] = await Promise.all([
    db.select({ id: establishments.id, name: establishments.name })
      .from(establishments)
      .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true))),

    db.select({
      id: tickets.id,
      status: tickets.status,
      establishmentId: tickets.establishmentId,
      createdAt: tickets.createdAt,
      attendedAt: tickets.attendedAt,
      completedAt: tickets.completedAt,
    })
      .from(tickets)
      .innerJoin(establishments, eq(tickets.establishmentId, establishments.id))
      .where(and(eq(establishments.brandId, brandId), gte(tickets.createdAt, since30)))
      .orderBy(desc(tickets.createdAt))
      .limit(1000),
  ])

  const estMap = Object.fromEntries(estList.map(e => [e.id, e.name]))

  const byEst = estList.map(est => {
    const estTickets = ticketList.filter(t => t.establishmentId === est.id)
    const attended = estTickets.filter(t => t.attendedAt)
    const completed = estTickets.filter(t => t.completedAt && t.attendedAt)
    const avgWait = attended.length > 0
      ? attended.reduce((s, t) => {
          const wait = (t.attendedAt!.getTime() - t.createdAt.getTime()) / 60000
          return s + wait
        }, 0) / attended.length
      : 0
    const avgService = completed.length > 0
      ? completed.reduce((s, t) => {
          const svc = (t.completedAt!.getTime() - t.attendedAt!.getTime()) / 60000
          return s + svc
        }, 0) / completed.length
      : 0
    return {
      id: est.id,
      name: est.name,
      total: estTickets.length,
      attended: attended.length,
      completed: completed.length,
      cancelled: estTickets.filter(t => t.status === 'cancelled').length,
      avgWaitMin: avgWait,
      avgServiceMin: avgService,
    }
  })

  const totalTickets = ticketList.length
  const totalAttended = ticketList.filter(t => t.attendedAt).length
  const globalAvgWait = byEst.length > 0
    ? byEst.reduce((s, e) => s + e.avgWaitMin, 0) / byEst.filter(e => e.attended > 0).length
    : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes de atención</h1>
        <p className="text-sm text-gray-500 mt-0.5">Últimos 30 días · {totalTickets} turnos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Turnos totales', value: totalTickets },
          { label: 'Atendidos', value: totalAttended },
          { label: 'Tasa de atención', value: totalTickets > 0 ? `${((totalAttended / totalTickets) * 100).toFixed(1)}%` : '—' },
          { label: 'Espera prom.', value: `${globalAvgWait.toFixed(0)} min` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Por sucursal (últimos 30 días)</h3>
        </div>
        {byEst.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <th className="px-4 py-2 text-left">Sucursal</th>
                  <th className="px-4 py-2 text-center">Turnos</th>
                  <th className="px-4 py-2 text-center">Atendidos</th>
                  <th className="px-4 py-2 text-center">Completados</th>
                  <th className="px-4 py-2 text-center">Cancelados</th>
                  <th className="px-4 py-2 text-center">Espera prom.</th>
                  <th className="px-4 py-2 text-center">Servicio prom.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byEst.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{e.name}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-center">{e.total}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-center">{e.attended}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-center">{e.completed}</td>
                    <td className="px-4 py-2.5 text-sm text-red-500 text-center">{e.cancelled}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-center">{e.attended > 0 ? `${e.avgWaitMin.toFixed(0)} min` : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-center">{e.completed > 0 ? `${e.avgServiceMin.toFixed(0)} min` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
