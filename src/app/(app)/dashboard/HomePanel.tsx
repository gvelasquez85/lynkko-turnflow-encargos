'use client'

import Link from 'next/link'
import {
  Shirt, Users, Clock, CheckCircle2, Plus, BarChart2,
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

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  received:    { label: 'Recibido', variant: 'info' },
  in_progress: { label: 'En proceso', variant: 'warning' },
  ready:       { label: 'Listo', variant: 'success' },
  delivered:   { label: 'Entregado', variant: 'success' },
  cancelled:   { label: 'Cancelado', variant: 'destructive' },
}

export function HomePanel({
  brandName, userName, encargosRecientes, stats, totalClients,
}: Props) {
  const firstName = userName?.split(' ')[0] || 'Usuario'

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {greeting()}, <strong className="text-foreground">{firstName}</strong>
        </p>
        <h1 className="text-2xl font-extrabold text-foreground mt-1">Hoy en {brandName}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Encargos totales', value: stats.total, sub: `${stats.received} pendientes`, icon: <Shirt size={14} />, color: 'text-sky-600', bg: 'bg-sky-500/10' },
          { label: 'Listos para recoger', value: stats.ready, sub: 'esperando cliente', icon: <CheckCircle2 size={14} />, color: 'text-green-600', bg: 'bg-green-500/10' },
          { label: 'En proceso', value: stats.inProgress, sub: 'trabajando ahora', icon: <Clock size={14} />, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          { label: 'Tus clientes', value: totalClients, sub: 'en tu base', icon: <Users size={14} />, color: 'text-sky-600', bg: 'bg-sky-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/encargos" className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-sky-500/10 text-sky-600">
              <Plus size={16} />
            </div>
            <span className="text-sm font-medium text-foreground flex-1">Nuevo encargo</span>
          </Link>
          <Link href="/clientes" className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-500/10 text-green-600">
              <Users size={16} />
            </div>
            <span className="text-sm font-medium text-foreground flex-1">Agregar cliente</span>
          </Link>
          <Link href="/reportes/servicios" className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-600">
              <BarChart2 size={16} />
            </div>
            <span className="text-sm font-medium text-foreground flex-1">Ver reportes</span>
          </Link>
        </div>
      </div>

      {/* Recent encargos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Encargos recientes</p>
          <Link href="/encargos" className="text-xs text-sky-600 hover:text-sky-700 font-medium">Ver todos →</Link>
        </div>

        {encargosRecientes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Shirt size={40} className="mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-1">Sin encargos</h3>
            <p className="text-sm text-muted-foreground mb-4">Crea tu primer encargo para comenzar</p>
            <Link href="/encargos" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700">
              <Plus size={16} />
              Crear encargo
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Código</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Descripción</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Precio</th>
                </tr>
              </thead>
              <tbody>
                {encargosRecientes.slice(0, 5).map(encargo => {
                  const status = STATUS_LABELS[encargo.status] || { label: encargo.status, variant: 'neutral' }
                  const statusColors: Record<string, string> = {
                    info: 'bg-sky-500/10 text-sky-700',
                    warning: 'bg-amber-500/10 text-amber-700',
                    success: 'bg-green-500/10 text-green-700',
                    destructive: 'bg-red-500/10 text-red-700',
                    neutral: 'bg-muted text-muted-foreground',
                  }
                  return (
                    <tr key={encargo.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{encargo.orderCode}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{encargo.itemDescription}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{encargo.customerName || 'Sin cliente'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status.variant]}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground text-right">{fmt(parseFloat(encargo.price || '0'))}</td>
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
