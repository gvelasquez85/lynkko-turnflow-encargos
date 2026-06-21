'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Shirt, Users, Clock, CheckCircle2, Plus, Package,
  TrendingUp, AlertCircle, BarChart2,
} from 'lucide-react'

interface EncargoReciente {
  id: string
  orderCode: string
  itemDescription: string
  status: string
  price: string
  createdAt: string
  customerName?: string | null
}

interface Props {
  brandName: string
  userName: string
  encargosRecientes: EncargoReciente[]
  stats: {
    total: number
    received: number
    inProgress: number
    ready: number
    delivered: number
  }
  totalClients: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received: { label: 'Recibido', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En proceso', color: 'bg-amber-100 text-amber-700' },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-700' },
  delivered: { label: 'Entregado', color: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500' },
}

export function HomePanel({
  brandName, userName, encargosRecientes, stats, totalClients,
}: Props) {
  const firstName = userName?.split(' ')[0] || 'Usuario'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-400">{greeting()}, <strong className="text-gray-600">{firstName}</strong></p>
        <h1 className="text-2xl font-black text-gray-900 mt-0.5">Hoy en {brandName}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Encargos totales</p>
            <Shirt size={14} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.received} pendientes</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Listos para recoger</p>
            <CheckCircle2 size={14} className="text-green-500" />
          </div>
          <p className="text-2xl font-black text-green-600">{stats.ready}</p>
          <p className="text-xs text-gray-400 mt-1">esperando cliente</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">En proceso</p>
            <Clock size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">{stats.inProgress}</p>
          <p className="text-xs text-gray-400 mt-1">trabajando ahora</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Tus clientes</p>
            <Users size={14} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalClients}</p>
          <p className="text-xs text-gray-400 mt-1">en tu base</p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/encargos"
            className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-indigo-600 bg-indigo-50">
              <Plus size={16} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">Nuevo encargo</span>
          </Link>
          <Link
            href="/clientes"
            className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-green-600 bg-green-50">
              <Users size={16} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">Agregar cliente</span>
          </Link>
          <Link
            href="/reportes/servicios"
            className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-amber-600 bg-amber-50">
              <BarChart2 size={16} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">Ver reportes</span>
          </Link>
        </div>
      </div>

      {/* Recent encargos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Encargos recientes</p>
          <Link href="/encargos" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Ver todos →</Link>
        </div>

        {encargosRecientes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Shirt size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Sin encargos</h3>
            <p className="text-sm text-gray-500 mb-4">Crea tu primer encargo para comenzar</p>
            <Link
              href="/encargos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              <Plus size={16} />
              Crear encargo
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                </tr>
              </thead>
              <tbody>
                {encargosRecientes.slice(0, 5).map(encargo => {
                  const status = STATUS_LABELS[encargo.status] || { label: encargo.status, color: 'bg-gray-100 text-gray-500' }
                  return (
                    <tr key={encargo.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{encargo.orderCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{encargo.itemDescription}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{encargo.customerName || 'Sin cliente'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{fmt(parseFloat(encargo.price || '0'))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
