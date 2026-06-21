'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth-client'
import {
  Building2, MessageSquare, Tag, BarChart2,
  Users, Store, Menu, ChevronLeft, ChevronRight, ChevronDown,
  LogOut, LayoutDashboard, Settings, Shield, Zap, Clock,
  ShoppingCart, Package, FileCheck, TrendingUp, HelpCircle,
  Shirt, Megaphone, Webhook, Key, Mail, Moon, Sun, User,
} from 'lucide-react'
import { TurnFlowLogo } from '@/components/brand/TurnFlowLogo'
import { useBrandStore } from '@/stores/brandStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { I18nProvider, useT } from '@/lib/i18n/context'

export type AppRole = 'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

interface NavSection {
  key: string
  section: string
  items: NavItem[]
}

// ─── Sidebar navigation for ENCARGO vertical ────────────────────────────────

const HOME_ITEM: NavItem = { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, exact: true }

const SUPERADMIN_ITEMS: NavItem[] = [
  { href: '/superadmin', label: 'Marcas', icon: Building2, exact: true },
  { href: '/superadmin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/superadmin/billing', label: 'Billing', icon: CreditCard },
  { href: '/marketplace', label: 'Marketplace', icon: Zap },
]

const BRAND_ITEMS: NavItem[] = [
  { href: '/configuracion/marca', label: 'Mi marca', icon: Building2 },
  { href: '/configuracion/sucursales', label: 'Sucursales', icon: Store, exact: true },
  { href: '/configuracion/usuarios', label: 'Equipo', icon: Users },
]

const MANAGER_BRAND_ITEMS: NavItem[] = [
  { href: '/configuracion/marca', label: 'Mi marca', icon: Building2 },
  { href: '/configuracion/sucursales', label: 'Sucursales', icon: Store, exact: true },
]

const CLIENTES_ITEMS: NavItem[] = [
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/configuracion/consents', label: 'Autorizaciones', icon: Shield },
]

const ENCARGOS_ITEMS: NavItem[] = [
  { href: '/encargos', label: 'Órdenes de encargo', icon: Shirt },
]

const SERVICES_ITEMS: NavItem[] = [
  { href: '/configuracion/servicios', label: 'Servicios', icon: Package },
]

const REPORTES_ITEMS: NavItem[] = [
  { href: '/reportes/servicios', label: 'Servicios', icon: BarChart2 },
  { href: '/reportes/clientes', label: 'Clientes', icon: Users },
]

const MENSAJES_ITEMS: NavItem[] = [
  { href: '/configuracion/mensajes', label: 'Mensajes WhatsApp', icon: MessageSquare },
]

const PROMOTIONS_ITEMS: NavItem[] = [
  { href: '/configuracion/promotions', label: 'Promociones', icon: Megaphone },
]

const INTEGRACIONES_ITEMS: NavItem[] = [
  { href: '/configuracion/integraciones', label: 'API Keys & Webhooks', icon: Webhook },
]

function buildSections(role: string, activeModules?: Record<string, boolean>): NavSection[] {
  if (role === 'reporting') {
    return [{ key: 'reportes', section: 'Reportes', items: [{ href: '/reportes', label: 'Reportes', icon: BarChart2 }] }]
  }

  if (role === 'superadmin') {
    return [
      { key: 'admin', section: 'Administración', items: SUPERADMIN_ITEMS },
      { key: 'marca', section: 'Mi Marca', items: BRAND_ITEMS },
      { key: 'clientes', section: 'Clientes', items: CLIENTES_ITEMS },
      { key: 'encargos', section: 'Encargos', items: ENCARGOS_ITEMS },
      { key: 'servicios', section: 'Servicios', items: SERVICES_ITEMS },
      { key: 'mensajes', section: 'Mensajes', items: MENSAJES_ITEMS },
      { key: 'promotions', section: 'Promociones', items: PROMOTIONS_ITEMS },
      { key: 'reportes', section: 'Reportes', items: REPORTES_ITEMS },
      { key: 'integraciones', section: 'Integraciones', items: INTEGRACIONES_ITEMS },
    ]
  }

  // brand_admin / manager
  const brandItems = role === 'brand_admin' ? BRAND_ITEMS : MANAGER_BRAND_ITEMS
  const sections: NavSection[] = [
    { key: 'home', section: 'Inicio', items: [HOME_ITEM] },
    { key: 'marca', section: 'Mi Marca', items: brandItems },
    { key: 'clientes', section: 'Clientes', items: CLIENTES_ITEMS },
    { key: 'encargos', section: 'Encargos', items: ENCARGOS_ITEMS },
    { key: 'servicios', section: 'Servicios', items: SERVICES_ITEMS },
  ]

  if (activeModules?.mensajes) {
    sections.push({ key: 'mensajes', section: 'Mensajes', items: MENSAJES_ITEMS })
  }

  sections.push({ key: 'reportes', section: 'Reportes', items: REPORTES_ITEMS })

  if (activeModules?.integraciones) {
    sections.push({ key: 'integraciones', section: 'Integraciones', items: INTEGRACIONES_ITEMS })
  }

  // Marketplace siempre visible para brand_admin
  if (role === 'brand_admin') {
    sections.push({
      key: 'marketplace', section: 'Más',
      items: [
        { href: '/marketplace', label: 'Marketplace', icon: Zap },
      ],
    })
  }

  return sections
}

const roleLabel: Record<AppRole, string> = {
  superadmin: 'Super Admin',
  brand_admin: 'Admin',
  manager: 'Manager',
  advisor: 'Agente',
  reporting: 'Reportes',
}

export interface AppShellProps {
  children: React.ReactNode
  role: AppRole
  fullName?: string | null
  email: string
  brandName?: string | null
  establishmentName?: string | null
  establishmentSlug?: string | null
  brands?: { id: string; name: string }[]
  activeModules?: Record<string, boolean>
  plan?: string
}

function AppShellInner({
  children, role, fullName, email, brandName, establishmentName, establishmentSlug,
  brands: initialBrands, activeModules, plan,
}: AppShellProps) {
  const { t } = useT()
  const { mode: layoutMode } = useLayoutStore()
  const tablet = layoutMode === 'tablet'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { selectedBrandId, setSelectedBrandId } = useBrandStore()
  const [brands, setBrands] = useState<{ id: string; name: string }[]>(initialBrands || [])
  const brandInitialized = useRef(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (role === 'superadmin' && (!initialBrands || initialBrands.length === 0)) {
      fetch('/api/superadmin/brands')
        .then(r => r.json())
        .then(data => { if (data.brands) setBrands(data.brands) })
        .catch(() => {})
    }
  }, [role])

  useEffect(() => {
    if (!brandInitialized.current && brands.length > 0 && !selectedBrandId) {
      brandInitialized.current = true
      if (role !== 'superadmin') setSelectedBrandId(brands[0].id)
    }
    if (brands.length > 0) brandInitialized.current = true
  }, [brands])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) setCollapsed(saved === 'true')
    } catch {}
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  async function handleLogout() {
    await signOut()
    router.push('/login')
  }

  function toggleDarkMode() {
    setDarkMode(d => {
      const next = !d
      try {
        if (next) {
          document.documentElement.classList.add('dark')
          localStorage.setItem('theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('theme', 'light')
        }
      } catch {}
      return next
    })
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const sections = buildSections(role, activeModules)
  const subtitle = brandName
    ? establishmentName ? `${brandName} · ${establishmentName}` : brandName
    : null

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const isCollapsed = collapsed && !mobile
    return (
      <>
        {/* Header */}
        <div className={cn(
          'flex items-center h-14 px-3 border-b border-gray-100 dark:border-gray-800 shrink-0',
          isCollapsed ? 'justify-center' : 'justify-between',
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <TurnFlowLogo size={28} />
              <span className="font-bold text-gray-900 dark:text-gray-100 tracking-tight">TurnFlow</span>
            </div>
          )}
          {isCollapsed && <TurnFlowLogo size={26} />}
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hidden md:flex items-center justify-center shrink-0"
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 md:hidden shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {sections.map((section, si) => (
            <div key={section.key} className={cn('flex flex-col', si > 0 && 'mt-1')}>
              {!isCollapsed && (
                <p className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {section.section}
                </p>
              )}
              {isCollapsed && si > 0 && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-2" />}
              <div className="flex flex-col gap-0.5">
                {section.items.map(item => {
                  const active = isActive(item.href, item.exact)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl transition-colors',
                        tablet ? 'px-3 py-3 text-base' : 'px-2 py-2 text-sm',
                        isCollapsed && 'justify-center',
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                      )}
                    >
                      <Icon size={tablet ? 22 : 18} className="shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 flex flex-col shadow-xl">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {brandName || 'TurnFlow Encargos'}
              </h1>
              {subtitle && <p className="text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>

          {/* Profile dropdown - top right */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserIcon size={16} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{fullName || email}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{roleLabel[role]}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{fullName || email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
                </div>

                {/* Dark mode toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
                </button>

                <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={16} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}

function X(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}

function UserIcon(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  )
}

function CreditCard(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

export default function AppShell(props: AppShellProps) {
  return <I18nProvider><AppShellInner {...props} /></I18nProvider>
}
