'use client'

import { useState, useEffect, useCallback } from 'react'
import { TicketCheck, CalendarCheck, ShoppingCart, Users, Clock } from 'lucide-react'
import type { VerticalLabels } from '@/lib/verticals'

type Periodo = 'hoy' | 'semana' | 'mes' | '30d'

interface ReportData {
  tickets: { total: number; atendidos: number; cancelados: number; tiempoPromedioMin: number }
  citas: { total: number; confirmadas: number; asistidas: number; canceladas: number }
  ventas: { total: number; monto: number; cotizaciones: number }
  clientes: { total: number; nuevosHoy: number }
  topAsesores: { advisorId: string; name: string; atendidos: number }[]
}

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: '30d', label: 'Últimos 30 días' },
]

function formatCurrency(value: number) {
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

interface ReportesPanelProps {
  labels: VerticalLabels
}

export default function ReportesPanel({ labels }: ReportesPanelProps) {
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async (p: Periodo) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reportes?periodo=${p}`)
      if (!res.ok) throw new Error('Error al cargar reportes')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(periodo)
  }, [periodo, fetchData])

  const kpis = data
    ? [
        {
          label: 'Turnos atendidos',
          value: data.tickets.atendidos,
          sub: `de ${data.tickets.total} totales`,
          icon: <TicketCheck size={20} className="text-indigo-500" />,
          color: 'bg-indigo-50',
        },
        {
          label: 'Citas confirmadas',
          value: data.citas.confirmadas,
          sub: `${data.citas.asistidas} asistidas`,
          icon: <CalendarCheck size={20} className="text-emerald-500" />,
          color: 'bg-emerald-50',
        },
        {
          label: `${labels.ventas} del período`,
          value: formatCurrency(data.ventas.monto),
          sub: `${data.ventas.total} ${labels.ventas.toLowerCase()}`,
          icon: <ShoppingCart size={20} className="text-blue-500" />,
          color: 'bg-blue-50',
          isText: true,
        },
        {
          label: `${labels.clientes} nuevos hoy`,
          value: data.clientes.nuevosHoy,
          sub: `${data.clientes.total} totales`,
          icon: <Users size={20} className="text-violet-500" />,
          color: 'bg-violet-50',
        },
      ]
    : []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">Métricas y desempeño del establecimiento</p>
        </div>

        {/* Selector de período */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                periodo === p.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-8 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-50 rounded w-2/3" />
              </div>
            ))
          : kpis.map((kpi, i) => (
              <div key={i} className={`${kpi.color} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  {kpi.icon}
                  <span className="text-sm text-gray-600 font-medium">{kpi.label}</span>
                </div>
                <div className={`font-bold text-gray-900 mb-1 ${kpi.isText ? 'text-xl' : 'text-3xl'}`}>
                  {kpi.value}
                </div>
                <div className="text-xs text-gray-500">{kpi.sub}</div>
              </div>
            ))}
      </div>

      {/* Tiempo promedio atención */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Asesores */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Top asesores</h2>
              <p className="text-xs text-gray-400 mt-0.5">Por turnos atendidos en el período</p>
            </div>
            {data.topAsesores.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">Sin datos para el período</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">#</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Asesor</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Atendidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.topAsesores.map((asesor, i) => (
                    <tr key={asesor.advisorId} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{asesor.name}</td>
                      <td className="px-5 py-3 text-right font-semibold text-indigo-600">{asesor.atendidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Resumen operativo */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Resumen operativo</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Clock size={18} className="text-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Tiempo promedio de atención</p>
                  <p className="font-bold text-gray-900">{data.tickets.tiempoPromedioMin} min</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Turnos cancelados</p>
                  <p className="font-bold text-red-600">{data.tickets.cancelados}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Cotizaciones</p>
                  <p className="font-bold text-blue-600">{data.ventas.cotizaciones}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Citas canceladas</p>
                  <p className="font-bold text-orange-600">{data.citas.canceladas}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{labels.clientes} totales</p>
                  <p className="font-bold text-violet-600">{data.clientes.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
