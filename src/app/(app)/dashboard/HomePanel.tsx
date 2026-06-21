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

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  received: { label: 'Recibido', bg: 'var(--c-primary-50)', fg: 'var(--c-primary)' },
  in_progress: { label: 'En proceso', bg: 'var(--c-warning-bg)', fg: 'var(--c-warning)' },
  ready: { label: 'Listo', bg: 'var(--c-success-bg)', fg: 'var(--c-success)' },
  delivered: { label: 'Entregado', bg: 'var(--c-success-bg)', fg: 'var(--c-success)' },
  cancelled: { label: 'Cancelado', bg: 'var(--c-destructive-bg)', fg: 'var(--c-destructive)' },
}

export function HomePanel({
  brandName, userName, encargosRecientes, stats, totalClients,
}: Props) {
  const firstName = userName?.split(' ')[0] || 'Usuario'

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ fontSize: '14px', color: 'var(--c-muted-fg)', margin: 0 }}>
          {greeting()}, <strong style={{ color: 'var(--c-fg)' }}>{firstName}</strong>
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--c-fg)', margin: '4px 0 0' }}>
          Hoy en {brandName}
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Encargos totales', value: stats.total, sub: `${stats.received} pendientes`, icon: <Shirt size={14} />, color: 'var(--c-primary)' },
          { label: 'Listos para recoger', value: stats.ready, sub: 'esperando cliente', icon: <CheckCircle2 size={14} />, color: 'var(--c-success)' },
          { label: 'En proceso', value: stats.inProgress, sub: 'trabajando ahora', icon: <Clock size={14} />, color: 'var(--c-warning)' },
          { label: 'Tus clientes', value: totalClients, sub: 'en tu base', icon: <Users size={14} />, color: 'var(--c-primary)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '12px', color: 'var(--c-muted-fg)', fontWeight: 500 }}>{stat.label}</span>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: 'var(--c-muted-fg)', marginTop: 'var(--space-1)' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--c-muted-fg)', marginBottom: 'var(--space-3)' }}>
          Acciones rápidas
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
          {[
            { href: '/encargos', icon: <Plus size={16} />, label: 'Nuevo encargo', color: 'var(--c-primary)', bg: 'var(--c-primary-50)' },
            { href: '/clientes', icon: <Users size={16} />, label: 'Agregar cliente', color: 'var(--c-success)', bg: 'var(--c-success-bg)' },
            { href: '/reportes/servicios', icon: <BarChart2 size={16} />, label: 'Ver reportes', color: 'var(--c-warning)', bg: 'var(--c-warning-bg)' },
          ].map((action, i) => (
            <Link key={i} href={action.href} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              background: 'var(--c-surface)', border: '1px solid var(--c-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
              textDecoration: 'none', transition: 'all var(--transition-base)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: action.bg, color: action.color, flexShrink: 0,
              }}>
                {action.icon}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--c-fg)' }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent encargos */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--c-muted-fg)' }}>
            Encargos recientes
          </p>
          <Link href="/encargos" style={{ fontSize: '12px', color: 'var(--c-primary)', fontWeight: 500, textDecoration: 'none' }}>
            Ver todos →
          </Link>
        </div>

        {encargosRecientes.length === 0 ? (
          <div style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center',
          }}>
            <Shirt size={40} style={{ margin: '0 auto 12px', color: 'var(--c-muted-fg)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--c-fg)', margin: '0 0 4px' }}>Sin encargos</h3>
            <p style={{ fontSize: '14px', color: 'var(--c-muted-fg)', margin: '0 0 16px' }}>Crea tu primer encargo para comenzar</p>
            <Link href="/encargos" style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)',
              background: 'var(--c-primary)', color: '#fff', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
            }}>
              <Plus size={16} />
              Crear encargo
            </Link>
          </div>
        ) : (
          <div style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-muted)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', fontWeight: 600, color: 'var(--c-muted-fg)', textTransform: 'uppercase' }}>Código</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', fontWeight: 600, color: 'var(--c-muted-fg)', textTransform: 'uppercase' }}>Descripción</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', fontWeight: 600, color: 'var(--c-muted-fg)', textTransform: 'uppercase' }}>Cliente</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', fontWeight: 600, color: 'var(--c-muted-fg)', textTransform: 'uppercase' }}>Estado</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', fontWeight: 600, color: 'var(--c-muted-fg)', textTransform: 'uppercase' }}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {encargosRecientes.slice(0, 5).map(encargo => {
                  const status = STATUS_LABELS[encargo.status] || { label: encargo.status, bg: 'var(--c-muted)', fg: 'var(--c-muted-fg)' }
                  return (
                    <tr key={encargo.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '13px', fontFamily: 'monospace', color: 'var(--c-muted-fg)' }}>{encargo.orderCode}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '13px', color: 'var(--c-fg)' }}>{encargo.itemDescription}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '13px', color: 'var(--c-muted-fg)' }}>{encargo.customerName || 'Sin cliente'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{
                          display: 'inline-flex', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          fontSize: '11px', fontWeight: 500, background: status.bg, color: status.fg,
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '13px', color: 'var(--c-muted-fg)', textAlign: 'right' }}>{fmt(parseFloat(encargo.price || '0'))}</td>
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
