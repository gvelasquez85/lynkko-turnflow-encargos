'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Users, ShoppingCart, Package, FileCheck,
  Sparkles, Bell, ChevronRight, MessageSquare,
  CheckCircle, ArrowRight, CalendarClock, Cake, Gift,
} from 'lucide-react'
import { SALE_COMPLETED_SET } from '@/lib/saleStatus'
import { PwaInstallBanner } from '@/components/PwaInstallBanner'

interface Sale { id: string; total: number; status: string; createdAt: string }

interface Props {
  brandName: string
  businessType: string
  userName: string
  salesRecent: Sale[]
  salesWeek: Sale[]
  totalClients: number
  inactiveClients: { id: string; name: string; phone: string | null; updatedAt: string }[]
  openQuotes: { id: string; total: number; createdAt: string; customerName?: string | null }[]
  lowStock: { id: string; name: string; stock: number }[]
  hasAppointments?: boolean
  appointments?: { id: string; status: string; scheduledAt: string; customerName: string }[]
  birthdayClients?: { id: string; name: string; phone: string | null; cumpleanos: string }[]
}

const VOCAB: Record<string, { service: string; client: string; clients: string }> = {
  belleza:     { service: 'servicio', client: 'clienta',  clients: 'clientas' },
  restaurante: { service: 'venta',   client: 'cliente',   clients: 'clientes' },
  ferreteria:  { service: 'venta',   client: 'cliente',   clients: 'clientes' },
  tienda:      { service: 'venta',   client: 'cliente',   clients: 'clientes' },
  servicios:   { service: 'servicio', client: 'cliente',  clients: 'clientes' },
  otros:       { service: 'venta',   client: 'cliente',   clients: 'clientes' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const APPT_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700'   },
  attended:  { label: 'Atendida',   color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',  color: 'bg-gray-100 text-gray-500'   },
  no_show:   { label: 'No asistió', color: 'bg-red-100 text-red-600'     },
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((new Date(d.toDateString()).getTime() - today.getTime()) / 86400000)
  if (diff === 0) return null
  if (diff === 1) return 'mañana'
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })
}

export function HomePanel({
  brandName, businessType, userName,
  salesRecent, salesWeek, totalClients,
  inactiveClients, openQuotes, lowStock,
  hasAppointments, appointments = [],
  birthdayClients = [],
}: Props) {
  const v = VOCAB[businessType] || VOCAB.otros
  const firstName = userName.split(' ')[0]
  const [dismissed, setDismissed] = useState<string[]>([])

  const todayStr = new Date().toDateString()

  const todaySales = useMemo(() =>
    salesRecent.filter(s => new Date(s.createdAt).toDateString() === todayStr),
    [salesRecent, todayStr])

  const countToday = todaySales.length
  const completedToday = todaySales.filter(s => SALE_COMPLETED_SET.has(s.status))
  const pendingToday   = todaySales.filter(s => s.status === 'pending')
  const revenueToday   = completedToday.reduce((s, x) => s + (x.total ?? 0), 0)
  const pendingRevenue = pendingToday.reduce((s, x) => s + (x.total ?? 0), 0)

  const revenueWeek = useMemo(() =>
    salesWeek.filter(s => SALE_COMPLETED_SET.has(s.status)).reduce((s, x) => s + (x.total ?? 0), 0),
    [salesWeek])

  const upcomingBirthdays = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return birthdayClients
      .map(c => {
        const [, mm, dd] = (c.cumpleanos || '').split('-').map(Number)
        if (!mm || !dd) return null
        const bday = new Date(today.getFullYear(), mm - 1, dd)
        if (bday < today) bday.setFullYear(bday.getFullYear() + 1)
        const diffDays = Math.round((bday.getTime() - today.getTime()) / 86400000)
        if (diffDays > 30) return null
        return { ...c, diffDays, birthdayDate: bday }
      })
      .filter(Boolean)
      .sort((a, b) => a!.diffDays - b!.diffDays) as (typeof birthdayClients[number] & { diffDays: number; birthdayDate: Date })[]
  }, [birthdayClients])

  const actions: { key: string; icon: React.ElementType; color: string; text: string; sub: string; href: string }[] = []
  if (inactiveClients.length > 0) {
    const first = inactiveClients[0]
    actions.push({
      key: 'inactive', icon: Users, color: 'bg-emerald-50 text-emerald-700',
      text: `${inactiveClients.length} ${inactiveClients.length > 1 ? v.clients : v.client} ${inactiveClients.length > 1 ? 'pueden' : 'puede'} volver a comprarte`,
      sub: `${first.name} lleva ${daysAgo(first.updatedAt)} días sin volver`,
      href: '/clientes',
    })
  }
  if (openQuotes.length > 0) {
    actions.push({
      key: 'quotes', icon: FileCheck, color: 'bg-amber-50 text-amber-700',
      text: `${openQuotes.length} cotización${openQuotes.length > 1 ? 'es' : ''} sin respuesta`,
      sub: `Lleva${openQuotes.length > 1 ? 'n' : ''} más de 2 días esperando`,
      href: '/ventas',
    })
  }
  if (lowStock.length > 0) {
    actions.push({
      key: 'stock', icon: Package, color: 'bg-red-50 text-red-700',
      text: `${lowStock.length} producto${lowStock.length > 1 ? 's' : ''} con poco inventario`,
      sub: `${lowStock[0].name}: quedan ${lowStock[0].stock} unidades`,
      href: '/ventas',
    })
  }
  const visibleActions = actions.filter(a => !dismissed.includes(a.key))

  return (
    <div className="space-y-6">
      <PwaInstallBanner />

      <div>
        <p className="text-sm text-gray-400">{greeting()}, <strong className="text-gray-600">{firstName}</strong></p>
        <h1 className="text-2xl font-black text-gray-900 mt-0.5">Hoy en {brandName}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Ventas hoy</p>
            <TrendingUp size={14} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{countToday}</p>
          <p className="text-xs text-gray-400 mt-1">
            {completedToday.length > 0 && `${fmt(revenueToday)} facturado`}
            {completedToday.length > 0 && pendingToday.length > 0 && ' · '}
            {pendingToday.length > 0 && <span className="text-amber-500">{pendingToday.length} pendiente{pendingToday.length > 1 ? 's' : ''}</span>}
            {countToday === 0 && 'sin ventas hoy'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Esta semana</p>
            <TrendingUp size={14} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{fmt(revenueWeek)}</p>
          <p className="text-xs text-gray-400 mt-1">últimos 7 días · facturadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Tus {v.clients}</p>
            <Users size={14} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalClients}</p>
          <p className="text-xs text-gray-400 mt-1">en tu base</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Por recuperar</p>
            <MessageSquare size={14} className="text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-500">{inactiveClients.length}</p>
          <p className="text-xs text-gray-400 mt-1">{v.clients} inactivos</p>
        </div>
      </div>

      {hasAppointments && (() => {
        const now = new Date()
        const todayStr2 = now.toDateString()
        const todayPending   = appointments.filter(a => new Date(a.scheduledAt).toDateString() === todayStr2 && a.status === 'pending').length
        const todayConfirmed = appointments.filter(a => new Date(a.scheduledAt).toDateString() === todayStr2 && a.status === 'confirmed').length
        const weekActive     = appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length
        const upcoming       = appointments.filter(a => new Date(a.scheduledAt) >= now).slice(0, 4)
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-indigo-500" />
                <p className="text-sm font-semibold text-gray-800">Citas programadas</p>
              </div>
              <Link href="/citas" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Ver todas →</Link>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="flex-1 min-w-[90px] bg-amber-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-black text-amber-700">{todayPending}</p>
                <p className="text-[10px] text-amber-600 font-medium leading-tight">Pendientes hoy</p>
              </div>
              <div className="flex-1 min-w-[90px] bg-blue-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-black text-blue-700">{todayConfirmed}</p>
                <p className="text-[10px] text-blue-600 font-medium leading-tight">Confirmadas hoy</p>
              </div>
              <div className="flex-1 min-w-[90px] bg-indigo-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-black text-indigo-700">{weekActive}</p>
                <p className="text-[10px] text-indigo-600 font-medium leading-tight">Esta semana</p>
              </div>
            </div>
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.map(appt => {
                  const statusCfg = APPT_STATUS[appt.status] ?? APPT_STATUS.pending
                  const label = dayLabel(appt.scheduledAt)
                  return (
                    <div key={appt.id} className="flex items-center gap-3 py-1">
                      <div className="text-center shrink-0 w-12">
                        <p className="text-sm font-bold text-gray-800 leading-none">{fmtTime(appt.scheduledAt)}</p>
                        {label && <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>}
                      </div>
                      <p className="flex-1 text-sm text-gray-700 truncate">{appt.customerName}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusCfg.color}`}>{statusCfg.label}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">Sin citas próximas</p>
            )}
          </div>
        )
      })()}

      {upcomingBirthdays.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cake size={16} className="text-pink-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cumpleaños próximos</p>
              <span className="text-[10px] font-bold bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">{upcomingBirthdays.length}</span>
            </div>
            <Link href="/clientes" className="text-xs text-indigo-600 font-medium hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {upcomingBirthdays.slice(0, 8).map(c => {
              const isToday = c.diffDays === 0
              const label = isToday ? '¡Hoy!' : c.diffDays === 1 ? 'Mañana' : `En ${c.diffDays} días`
              const dateStr = c.birthdayDate.toLocaleDateString('es', { day: 'numeric', month: 'short' })
              return (
                <div key={c.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isToday ? 'bg-pink-50 border border-pink-200' : 'hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isToday ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
                    {isToday ? <Gift size={14} /> : <Cake size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isToday ? 'text-pink-900' : 'text-gray-900'}`}>{c.name}</p>
                    <p className="text-xs text-gray-400">{dateStr} · {label}</p>
                  </div>
                  {c.phone && (
                    <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <MessageSquare size={11} /> Felicitar
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-indigo-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones para hoy</p>
          </div>
          {visibleActions.length > 0 ? (
            <div className="space-y-3">
              {visibleActions.map(action => {
                const Icon = action.icon
                return (
                  <div key={action.key} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{action.text}</p>
                      <p className="text-xs text-gray-400 truncate">{action.sub}</p>
                    </div>
                    <Link href={action.href} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0">
                      Ver <ChevronRight size={12} />
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">¡Todo al día!</p>
                <p className="text-sm text-emerald-600">Sin pendientes urgentes por ahora.</p>
              </div>
            </div>
          )}

          {inactiveClients.length > 0 && (
            <div className="mt-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-indigo-600" />
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Sugerencia IA</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {inactiveClients[0].name} lleva {daysAgo(inactiveClients[0].updatedAt)} días sin volver
              </p>
              <p className="text-sm text-gray-600 mb-3">¿Generamos un mensaje para WhatsApp?</p>
              <Link href={`/clientes?action=message&clientId=${inactiveClients[0].id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                <MessageSquare size={13} /> Generar mensaje
              </Link>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Accesos rápidos</p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Nueva venta',      icon: ShoppingCart, href: '/ventas',          color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Agregar cliente',  icon: Users,        href: '/clientes',         color: 'text-indigo-600 bg-indigo-50'  },
              { label: 'Nueva cotización', icon: FileCheck,    href: '/ventas?type=quote',color: 'text-amber-600 bg-amber-50'    },
              { label: 'Ver productos',    icon: Package,      href: '/ventas',           color: 'text-blue-600 bg-blue-50'      },
            ].map(item => {
              const Icon = item.icon
              return (
                <Link key={item.href + item.label} href={item.href}
                  className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}><Icon size={16} /></div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{item.label}</span>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
