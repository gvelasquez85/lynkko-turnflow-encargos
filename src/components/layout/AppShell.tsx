'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth-client'
import {
  Building2, MessageSquare, BarChart2,
  Users, Store, Menu, ChevronLeft, ChevronRight, ChevronDown,
  LogOut, LayoutDashboard, Settings, Shield, Zap, Clock,
  Package, Shirt, Megaphone, Webhook, Moon, Sun,
} from 'lucide-react'
import { TurnFlowLogo } from '@/components/brand/TurnFlowLogo'
import { useBrandStore } from '@/stores/brandStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { I18nProvider, useT } from '@/lib/i18n/context'

export type AppRole = 'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting'

interface NavItem { href: string; label: string; icon: React.ElementType; exact?: boolean }
interface NavSection { key: string; section: string; items: NavItem[] }

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
const ENCARGOS_ITEMS: NavItem[] = [{ href: '/encargos', label: 'Órdenes de encargo', icon: Shirt }]
const SERVICES_ITEMS: NavItem[] = [{ href: '/configuracion/servicios', label: 'Servicios', icon: Package }]
const REPORTES_ITEMS: NavItem[] = [
  { href: '/reportes/servicios', label: 'Servicios', icon: BarChart2 },
  { href: '/reportes/clientes', label: 'Clientes', icon: Users },
]
const MENSAJES_ITEMS: NavItem[] = [{ href: '/configuracion/mensajes', label: 'Mensajes WhatsApp', icon: MessageSquare }]
const PROMOTIONS_ITEMS: NavItem[] = [{ href: '/configuracion/promotions', label: 'Promociones', icon: Megaphone }]
const INTEGRACIONES_ITEMS: NavItem[] = [{ href: '/configuracion/integraciones', label: 'API Keys & Webhooks', icon: Webhook }]

function buildSections(role: string, activeModules?: Record<string, boolean>): NavSection[] {
  if (role === 'reporting') return [{ key: 'reportes', section: 'Reportes', items: [{ href: '/reportes', label: 'Reportes', icon: BarChart2 }] }]
  if (role === 'superadmin') return [
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
  const brandItems = role === 'brand_admin' ? BRAND_ITEMS : MANAGER_BRAND_ITEMS
  const sections: NavSection[] = [
    { key: 'home', section: 'Inicio', items: [HOME_ITEM] },
    { key: 'marca', section: 'Mi Marca', items: brandItems },
    { key: 'clientes', section: 'Clientes', items: CLIENTES_ITEMS },
    { key: 'encargos', section: 'Encargos', items: ENCARGOS_ITEMS },
    { key: 'servicios', section: 'Servicios', items: SERVICES_ITEMS },
  ]
  if (activeModules?.mensajes) sections.push({ key: 'mensajes', section: 'Mensajes', items: MENSAJES_ITEMS })
  sections.push({ key: 'reportes', section: 'Reportes', items: REPORTES_ITEMS })
  if (activeModules?.integraciones) sections.push({ key: 'integraciones', section: 'Integraciones', items: INTEGRACIONES_ITEMS })
  if (role === 'brand_admin') sections.push({ key: 'marketplace', section: 'Más', items: [{ href: '/marketplace', label: 'Marketplace', icon: Zap }] })
  return sections
}

const roleLabel: Record<AppRole, string> = {
  superadmin: 'Super Admin', brand_admin: 'Admin', manager: 'Manager', advisor: 'Agente', reporting: 'Reportes',
}

export interface AppShellProps {
  children: React.ReactNode; role: AppRole; fullName?: string | null; email: string;
  brandName?: string | null; establishmentName?: string | null; establishmentSlug?: string | null;
  brands?: { id: string; name: string }[]; activeModules?: Record<string, boolean>; plan?: string;
}

function AppShellInner({ children, role, fullName, email, brandName, establishmentName, brands: initialBrands, activeModules }: AppShellProps) {
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
      fetch('/api/superadmin/brands').then(r => r.json()).then(data => { if (data.brands) setBrands(data.brands) }).catch(() => {})
    }
  }, [role])

  useEffect(() => {
    if (!brandInitialized.current && brands.length > 0 && !selectedBrandId) {
      brandInitialized.current = true
      if (role !== 'superadmin') setSelectedBrandId(brands[0].id)
    }
    if (brands.length > 0) brandInitialized.current = true
  }, [brands])

  useEffect(() => { try { const s = localStorage.getItem('sidebar-collapsed'); if (s !== null) setCollapsed(s === 'true') } catch {} }, [])

  useEffect(() => {
    function h(e: MouseEvent) { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  function toggleCollapsed() { setCollapsed(c => { const n = !c; try { localStorage.setItem('sidebar-collapsed', String(n)) } catch {}; return n }) }
  async function handleLogout() { await signOut(); router.push('/login') }
  function toggleDarkMode() { setDarkMode(d => { const n = !d; try { n ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); localStorage.setItem('theme', n ? 'dark' : 'light') } catch {}; return n }) }
  function isActive(href: string, exact?: boolean) { return exact ? pathname === href : pathname.startsWith(href) }

  const sections = buildSections(role, activeModules)
  const subtitle = brandName ? (establishmentName ? `${brandName} · ${establishmentName}` : brandName) : null

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const ic = collapsed && !mobile
    return (
      <>
        <div className={cn('flex items-center h-14 px-3 shrink-0', ic ? 'justify-center' : 'justify-between')} style={{ borderBottom: '1px solid var(--c-border)' }}>
          {!ic && <div className="flex items-center gap-2.5"><TurnFlowLogo size={28} /><span className="font-bold tracking-tight" style={{ color: 'var(--c-fg)' }}>TurnFlow</span></div>}
          {ic && <TurnFlowLogo size={26} />}
          <button onClick={toggleCollapsed} className="p-1.5 rounded-lg hidden md:flex items-center justify-center shrink-0" style={{ color: 'var(--c-muted-fg)' }}>
            {ic ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg md:hidden shrink-0" style={{ color: 'var(--c-muted-fg)' }}><X size={15} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {sections.map((section, si) => (
            <div key={section.key} className={cn('flex flex-col', si > 0 && 'mt-1')}>
              {!ic && <p className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-muted-fg)' }}>{section.section}</p>}
              {ic && si > 0 && <div className="h-px mx-2 my-2" style={{ background: 'var(--c-border)' }} />}
              <div className="flex flex-col gap-0.5">
                {section.items.map(item => {
                  const active = isActive(item.href, item.exact); const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} title={ic ? item.label : undefined}
                      className={cn('flex items-center gap-3 rounded-xl transition-colors', tablet ? 'px-3 py-3 text-base' : 'px-2 py-2 text-sm', ic && 'justify-center')}
                      style={{ background: active ? 'var(--c-primary-50)' : 'transparent', color: active ? 'var(--c-primary)' : 'var(--c-muted-fg)' }}>
                      <Icon size={tablet ? 22 : 18} className="shrink-0" />
                      {!ic && <span className="truncate">{item.label}</span>}
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
    <div className="flex h-screen" style={{ background: 'var(--c-bg)', color: 'var(--c-fg)' }}>
      <aside className={cn('hidden md:flex flex-col transition-all shrink-0', collapsed ? 'w-16' : 'w-60')} style={{ background: 'var(--c-surface)', borderRight: '1px solid var(--c-border)' }}>
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col shadow-xl" style={{ background: 'var(--c-surface)' }}>
            <SidebarContent mobile />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 shrink-0" style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg" style={{ color: 'var(--c-muted-fg)' }}><Menu size={20} /></button>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: 'var(--c-fg)' }}>{brandName || 'TurnFlow Encargos'}</h1>
              {subtitle && <p className="text-[11px]" style={{ color: 'var(--c-muted-fg)' }}>{subtitle}</p>}
            </div>
          </div>
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--c-primary-50)', color: 'var(--c-primary)' }}><UserIcon size={16} /></div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-tight" style={{ color: 'var(--c-fg)' }}>{fullName || email}</p>
                <p className="text-[11px]" style={{ color: 'var(--c-muted-fg)' }}>{roleLabel[role]}</p>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--c-muted-fg)' }} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg py-1 z-50" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--c-fg)' }}>{fullName || email}</p>
                  <p className="text-xs" style={{ color: 'var(--c-muted-fg)' }}>{email}</p>
                </div>
                <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-3 py-2 text-sm" style={{ color: 'var(--c-fg)' }}>
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
                </button>
                <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--c-border)' }}>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm" style={{ color: 'var(--c-destructive)' }}>
                    <LogOut size={16} /><span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--c-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function X(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>)
}
function UserIcon(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>)
}
function CreditCard(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>)
}

export default function AppShell(props: AppShellProps) {
  return <I18nProvider><AppShellInner {...props} /></I18nProvider>
}
