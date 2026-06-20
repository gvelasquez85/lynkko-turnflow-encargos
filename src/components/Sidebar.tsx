'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@lynkko/utils'
import { signOut } from '@/lib/auth-client'
import {
  LayoutDashboard, Users, CalendarDays, ShoppingBag,
  BarChart3, Settings, LogOut, Ticket, ChevronRight,
  Shield, ClipboardList, MessageSquare,
} from 'lucide-react'

interface NavItem {
  label:  string
  href:   string
  icon:   React.ElementType
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Cola de turnos',href: '/advisor',         icon: Ticket },
  { label: 'Clientes',      href: '/clientes',        icon: Users,          roles: ['brand_admin','manager','reporting'] },
  { label: 'Citas',         href: '/citas',           icon: CalendarDays,   roles: ['brand_admin','manager','advisor'] },
  { label: 'Ventas',         href: '/ventas',          icon: ShoppingBag,    roles: ['brand_admin','manager','advisor'] },
  { label: 'Pedidos',        href: '/pedidos',         icon: ClipboardList,  roles: ['brand_admin','manager','advisor'] },
  { label: 'Reportes',       href: '/reportes',        icon: BarChart3,      roles: ['brand_admin','manager','reporting'] },
  { label: 'Comunicaciones', href: '/comunicaciones',  icon: MessageSquare,  roles: ['brand_admin','manager'] },
  { label: 'Configuración', href: '/configuracion',   icon: Settings,       roles: ['brand_admin','manager'] },
  { label: 'Superadmin',    href: '/superadmin',      icon: Shield,         roles: ['superadmin'] },
]

interface Props {
  user: { name: string; email: string; role: string }
}

export function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user.role)
  )

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-lg font-bold text-gray-900">Turnflow</p>
        <p className="text-xs text-gray-400">by Lynkko</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon    = item.icon
          const active  = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon size={17} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={13} className="text-indigo-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-indigo-700">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
