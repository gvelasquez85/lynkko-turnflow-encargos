'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth-client'
import {
  Building2, MessageSquare, Tag, BarChart2,
  Users, Store, Menu, ChevronLeft, ChevronRight, ChevronDown,
  LogOut, LayoutDashboard, X, Eye, ArrowLeft,
  Settings, Shield, CreditCard, Zap, Clock,
  ShoppingCart, Package, FileCheck, TrendingUp, HelpCircle,
  Receipt, MessageSquareWarning, Building, ToggleRight,
  Shirt, Megaphone, Webhook, Key, Mail,
} from 'lucide-react'
import { TurnFlowLogo } from '@/components/brand/TurnFlowLogo'
import { useBrandStore } from '@/stores/brandStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { I18nProvider, useT } from '@/lib/i18n/context'
import { SUPPORTED_LANGUAGES, type LangCode } from '@/lib/i18n/translations'

export type AppRole = 'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting'

interface NavItem {
  href: string
  label: string
  labelKey?: string
  icon: React.ElementType
  exact?: boolean
}

interface NavSection {
  key: string
  section: string
  sectionKey?: string
  items: NavItem[]
}

// ─── Item definitions for ENCARGO vertical ────────────────────────────────────

const HOME_ITEM: NavItem = { href: '/dashboard', label: 'Inicio', labelKey: 'nav.home', icon: LayoutDashboard, exact: true }

// Superadmin
const SUPERADMIN_ITEMS: NavItem[] = [
  { href: '/superadmin',            label: 'Marcas',               labelKey: 'nav.brands',       icon: Building2, exact: true },
  { href: '/superadmin/analytics',  label: 'Analytics',                                          icon: BarChart2 },
  { href: '/superadmin/billing',    label: 'Billing',                                            icon: CreditCard },
  { href: '/marketplace',           label: 'Marketplace',                                        icon: Zap },
]

// Brand admin / manager
const BRAND_ITEMS: NavItem[] = [
  { href: '/configuracion/marca',      label: 'Mi marca',   labelKey: 'nav.brand',    icon: Building2 },
  { href: '/configuracion/sucursales', label: 'Sucursales', labelKey: 'nav.branches', icon: Store, exact: true },
  { href: '/configuracion/usuarios',   label: 'Equipo',     labelKey: 'nav.team',     icon: Users },
]

const MANAGER_BRAND_ITEMS: NavItem[] = [
  { href: '/configuracion/marca',      label: 'Mi marca',   labelKey: 'nav.brand',    icon: Building2 },
  { href: '/configuracion/sucursales', label: 'Sucursales', labelKey: 'nav.branches', icon: Store, exact: true },
]

// Core modules
const CLIENTES_ITEMS: NavItem[] = [
  { href: '/clientes',                  label: 'Clientes',        labelKey: 'nav.customers', icon: Users },
  { href: '/configuracion/consents',    label: 'Autorizaciones',  labelKey: 'nav.consents',  icon: Shield },
]

const ENCARGOS_ITEMS: NavItem[] = [
  { href: '/encargos', label: 'Órdenes de encargo', icon: Shirt },
]

const VENTAS_ITEMS: NavItem[] = [
  { href: '/ventas', label: 'Ventas', labelKey: 'nav.sales', icon: ShoppingCart, exact: true },
]

const REPORTES_ITEMS: NavItem[] = [
  { href: '/reportes/clientes', label: 'Clientes', labelKey: 'nav.customers', icon: Users },
  { href: '/reportes/ventas',   label: 'Ventas',   labelKey: 'nav.sales',     icon: TrendingUp },
]

// Config modules
const MENSAJES_ITEMS: NavItem[] = [
  { href: '/configuracion/mensajes', label: 'Mensajes WhatsApp', icon: MessageSquare },
]

const PROMOTIONS_ITEMS: NavItem[] = [
  { href: '/configuracion/promotions', label: 'Promociones', icon: Megaphone },
]

const INTEGRACIONES_ITEMS: NavItem[] = [
  { href: '/configuracion/integraciones', label: 'API Keys & Webhooks', icon: Webhook },
]

// ─── Section builder ────────────────────────────────────────────────────────────

function buildSections(
  role: string,
  activeModules?: Record<string, boolean>,
): NavSection[] {
  if (role === 'reporting') {
    return [{ key: 'reportes', section: 'Reportes', items: [{ href: '/reportes', label: 'Reportes', icon: BarChart2 }] }]
  }

  if (role === 'superadmin') {
    return [
      {
        key: 'admin', section: 'Administración', sectionKey: 'section.admin',
        items: SUPERADMIN_ITEMS,
      },
      { key: 'marca',    section: 'Mi Marca',  sectionKey: 'section.myBrand', items: BRAND_ITEMS },
      { key: 'clientes', section: 'Clientes',  sectionKey: 'section.clients', items: CLIENTES_ITEMS },
      { key: 'encargos', section: 'Encargos',  items: ENCARGOS_ITEMS },
      { key: 'ventas',   section: 'Ventas',    sectionKey: 'section.sales',   items: VENTAS_ITEMS },
      { key: 'mensajes', section: 'Mensajes',  items: MENSAJES_ITEMS },
      { key: 'promotions', section: 'Promociones', items: PROMOTIONS_ITEMS },
      { key: 'reportes', section: 'Reportes', sectionKey: 'section.reportsSection', items: REPORTES_ITEMS },
      { key: 'integraciones', section: 'Integraciones', items: INTEGRACIONES_ITEMS },
    ]
  }

  // brand_admin / manager
  const brandItems = role === 'brand_admin' ? BRAND_ITEMS : MANAGER_BRAND_ITEMS

  const sections: NavSection[] = [
    { key: 'home',     section: 'Inicio',    sectionKey: 'nav.home',         items: [HOME_ITEM] },
    { key: 'marca',    section: 'Mi Marca',  sectionKey: 'section.myBrand',  items: brandItems },
    { key: 'clientes', section: 'Clientes',  sectionKey: 'section.clients',  items: CLIENTES_ITEMS },
    { key: 'encargos', section: 'Encargos',  items: ENCARGOS_ITEMS },
  ]

  sections.push({ key: 'ventas', section: 'Ventas', sectionKey: 'section.sales', items: VENTAS_ITEMS })

  if (activeModules?.mensajes) {
    sections.push({ key: 'mensajes', section: 'Mensajes', items: MENSAJES_ITEMS })
  }

  sections.push({ key: 'reportes', section: 'Reportes', sectionKey: 'section.reportsSection', items: REPORTES_ITEMS })

  if (activeModules?.integraciones) {
    sections.push({ key: 'integraciones', section: 'Integraciones', items: INTEGRACIONES_ITEMS })
  }

  // Marketplace siempre visible para brand_admin
  if (role === 'brand_admin') {
    sections.push({
      key: 'marketplace', section: 'Más', sectionKey: 'section.more',
      items: [
        { href: '/marketplace', label: 'Marketplace', icon: Zap },
        { href: '/ayuda',       label: 'Centro de Ayuda', icon: HelpCircle },
      ],
    })
  }

  return sections
}

const roleLabel: Record<AppRole, string> = {
  superadmin: 'Super Admin',
  brand_admin: 'Admin',
  manager:    'Manager',
  advisor:    'Agente',
  reporting:  'Reportes',
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
  lang?: LangCode
}

const CAN_IMPERSONATE: AppRole[] = ['superadmin', 'brand_admin']

function AppShellInner({
  children, role, fullName, email, brandName, establishmentName, establishmentSlug,
  brands: initialBrands, activeModules, plan,
}: AppShellProps) {
  const { t, lang, setLang } = useT()
  const { mode: layoutMode, toggle: toggleLayoutMode } = useLayoutStore()
  const tablet = layoutMode === 'tablet'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [viewAs, setViewAs] = useState<AppRole | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const router = useRouter()
  const { selectedBrandId, setSelectedBrandId } = useBrandStore()
  const [brands, setBrands] = useState<{ id: string; name: string }[]>(initialBrands || [])
  const brandInitialized = useRef(false)

  useEffect(() => {
    if (role === 'superadmin' && (!initialBrands || initialBrands.length === 0)) {
      fetch('/api/superadmin/brands')
        .then(r => r.json())
        .then(data => { if (data.brands) setBrands(data.brands) })
        .catch(() => {})
    }
  }, [role]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!brandInitialized.current && brands.length > 0 && !selectedBrandId) {
      brandInitialized.current = true
      if (role !== 'superadmin') setSelectedBrandId(brands[0].id)
    }
    if (brands.length > 0) brandInitialized.current = true
  }, [brands]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) setCollapsed(saved === 'true')
    } catch {}
    try {
      const savedSections = localStorage.getItem('sidebar-sections-collapsed')
      if (savedSections) setCollapsedSections(JSON.parse(savedSections))
    } catch {}
    try {
      const m = document.cookie.match(/ta_view_as=([^;]+)/)
      const validRoles: AppRole[] = ['superadmin', 'brand_admin', 'manager', 'advisor', 'reporting']
      if (m && validRoles.includes(m[1] as AppRole)) setViewAs(m[1] as AppRole)
      else if (m) document.cookie = 'ta_view_as=; path=/; max-age=0'
    } catch {}
  }, [])

  function startImpersonate() {
    document.cookie = 'ta_view_as=advisor; path=/; max-age=7200'
    setViewAs('advisor')
    router.push('/dashboard')
  }

  function stopImpersonate() {
    document.cookie = 'ta_view_as=; path=/; max-age=0'
    setViewAs(null)
    router.push('/dashboard')
  }

  function startBrandManager() {
    if (!selectedBrandId) return
    document.cookie = `sa_brand=${selectedBrandId}; path=/; max-age=7200`
    document.cookie = 'ta_view_as=brand_admin; path=/; max-age=7200'
    setViewAs('brand_admin')
    router.push('/dashboard')
  }

  function stopBrandManager() {
    document.cookie = 'ta_view_as=; path=/; max-age=0'
    setViewAs(null)
    router.push('/superadmin')
  }

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  function toggleSectionCollapsed(key: string) {
    setCollapsedSections(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem('sidebar-sections-collapsed', JSON.stringify(next)) } catch {}
      return next
    })
  }

  async function handleLogout() {
    await signOut()
    router.push('/login')
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const activeRole = (viewAs && ['superadmin', 'brand_admin', 'manager', 'advisor', 'reporting'].includes(viewAs) ? viewAs : null) || role
  const sections = buildSections(activeRole, activeModules)
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

        {/* Brand selector + Brand Manager toggle (superadmin only) */}
        {role === 'superadmin' && brands.length > 0 && !isCollapsed && !viewAs && (
          <div className="px-3 pt-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Marca</p>
            <select
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none"
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
            >
              <option value="">— Todas las marcas —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {selectedBrandId && (
              <button
                onClick={startBrandManager}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Eye size={13} />
                Gestionar marca
              </button>
            )}
          </div>
        )}
        {role === 'superadmin' && viewAs === 'brand_admin' && !isCollapsed && (
          <div className="px-3 pt-2 pb-2 border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 mb-1">Brand Manager</p>
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 truncate">
              {brands.find(b => b.id === selectedBrandId)?.name || 'Marca'}
            </p>
          </div>
        )}
        {role === 'superadmin' && brands.length > 0 && isCollapsed && (
          <div className="flex justify-center py-2 border-b border-gray-100 dark:border-gray-800">
            <Building2 size={16} className={viewAs === 'brand_admin' ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'} aria-label={brands.find(b => b.id === selectedBrandId)?.name} />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {sections.map((section, si) => {
            const isSectionCollapsed = !isCollapsed && !!collapsedSections[section.key]
            return (
              <div key={section.key} className={cn('flex flex-col', si > 0 && 'mt-1')}>
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleSectionCollapsed(section.key)}
                    className="flex items-center justify-between w-full px-2 pt-3 pb-1 group"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                      {section.sectionKey ? t(section.sectionKey, section.section) : section.section}
                    </span>
                    <ChevronDown
                      size={12}
                      className={cn(
                        'text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-all',
                        isSectionCollapsed ? '-rotate-90' : 'rotate-0',
                      )}
                    />
                  </button>
                ) : (
                  si > 0 && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-2" />
                )}

                {!isSectionCollapsed && (
                  <div className="flex flex-col gap-0.5">
                    {section.items.map(item => {
                      const active = isActive(item.href, item.exact)
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          title={isCollapsed ? (item.labelKey ? t(item.labelKey, item.label) : item.label) : undefined}
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
                          {!isCollapsed && <span className="truncate">{item.labelKey ? t(item.labelKey, item.label) : item.label}</span>}
                          {isCollapsed && <span className="sr-only">{item.labelKey ? t(item.labelKey, item.label) : item.label}</span>}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 p-3">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{fullName || email}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{roleLabel[activeRole]}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            {CAN_IMPERSONATE.includes(role) && !viewAs && (
              <button
                onClick={startImpersonate}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Ver como asesor"
              >
                <Eye size={13} />
                {!isCollapsed && 'Ver como asesor'}
              </button>
            )}
            {viewAs && (
              <button
                onClick={viewAs === 'brand_admin' ? stopBrandManager : stopImpersonate}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <ArrowLeft size={13} />
                {!isCollapsed && 'Volver'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              <LogOut size={13} />
              {!isCollapsed && 'Salir'}
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={cn('flex h-screen bg-gray-50 dark:bg-gray-950', tablet && 'max-w-[1024px] mx-auto border-x border-gray-200 dark:border-gray-800')}>
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
          <div className="flex items-center gap-2">
            {/* Language selector */}
            <select
              value={lang}
              onChange={e => setLang(e.target.value as LangCode)}
              className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-gray-600 dark:text-gray-400"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function UserCircle(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  )
}

export default function AppShell(props: AppShellProps) {
  return <I18nProvider><AppShellInner {...props} /></I18nProvider>
}
