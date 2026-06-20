import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Building2, Users, ListChecks, Monitor, ClipboardList, CreditCard, Plug, UtensilsCrossed } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configuración' }

export default async function ConfiguracionPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string }
  const isAdmin = ['brand_admin', 'manager'].includes(user.role ?? '')

  const cards = [
    {
      title: 'Establecimiento',
      desc:  'Nombre, dirección y datos de tu sucursal',
      href:  '/configuracion/establecimiento',
      icon:  Building2,
      color: 'bg-indigo-50 text-indigo-600',
      show:  isAdmin,
    },
    {
      title: 'Usuarios',
      desc:  'Gestiona asesores y administradores',
      href:  '/configuracion/usuarios',
      icon:  Users,
      color: 'bg-purple-50 text-purple-600',
      show:  isAdmin,
    },
    {
      title: 'Cola de turnos',
      desc:  'Motivos de visita y campos del formulario',
      href:  '/configuracion/cola',
      icon:  ListChecks,
      color: 'bg-blue-50 text-blue-600',
      show:  isAdmin,
    },
    {
      title: 'Display TV',
      desc:  'Pantalla de sala de espera y pantalla pública',
      href:  '/configuracion/display',
      icon:  Monitor,
      color: 'bg-emerald-50 text-emerald-600',
      show:  true,
    },
    {
      title: 'Menú & Pedidos',
      desc:  'Configura menús, categorías e ítems para pedidos',
      href:  '/configuracion/menu',
      icon:  UtensilsCrossed,
      color: 'bg-rose-50 text-rose-600',
      show:  isAdmin,
    },
    {
      title: 'Encuestas',
      desc:  'Crea y gestiona encuestas de satisfacción',
      href:  '/configuracion/encuestas',
      icon:  ClipboardList,
      color: 'bg-orange-50 text-orange-600',
      show:  isAdmin,
    },
    {
      title: 'Facturación',
      desc:  'Plan, membresía e historial de pagos',
      href:  '/configuracion/billing',
      icon:  CreditCard,
      color: 'bg-yellow-50 text-yellow-600',
      show:  user.role === 'brand_admin',
    },
    {
      title: 'Integraciones',
      desc:  'API Keys y webhooks para conectar sistemas externos',
      href:  '/configuracion/integraciones',
      icon:  Plug,
      color: 'bg-cyan-50 text-cyan-600',
      show:  user.role === 'brand_admin',
    },
  ].filter(c => c.show)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Administra tu negocio y tus sucursales</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                <Icon size={22} />
              </div>
              <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{card.title}</p>
              <p className="text-sm text-gray-500 mt-1 leading-snug">{card.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
