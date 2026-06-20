'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2, CreditCard, Check, CheckCircle,
  X, AlertTriangle, Key, Webhook, Copy, Trash2, Plus, Minus,
  Globe, Lock, RefreshCw, Store, Users, TrendingUp, Package, Zap,
  ArrowRight, ShoppingCart, Clock, AlertCircle,
} from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/translations'
import {
  toCents, fromCents, formatCurrency,
  type BillingCurrency,
} from '@/lib/billing-cop'
import {
  PLANS, ADDON_PRICES_COP, normalizePlan, upgradePlans, fmtCOP,
  type PlanKey,
} from '@/lib/planLimits'
import { WompiCardForm } from '@/components/WompiCardForm'
import { VERTICALS, type Vertical, type VerticalModule } from '@/lib/verticals'

interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  fontColor: string | null
  address: string | null
  contactEmail: string | null
  website: string | null
  language: string | null
  country: string | null
  businessType: string | null
  activeModules: Record<string, any> | null
}

const COUNTRIES = [
  'Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Venezuela',
  'Bolivia', 'Paraguay', 'Uruguay', 'Brasil', 'Panamá', 'Costa Rica',
  'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'República Dominicana',
  'Cuba', 'Puerto Rico', 'España', 'Estados Unidos', 'Canadá', 'Otro',
]

interface Membership {
  id: string
  plan: string
  status: string
  startedAt: string
  expiresAt: string | null
  maxEstablishments: number
  maxAdvisors: number
  wompiPaymentSourceId?: string | null
  wompiCustomerEmail?: string | null
  billingCurrency?: BillingCurrency | null
  billingAnchorDay?: number | null
  billingStatus?: 'none' | 'active' | 'past_due' | 'suspended' | null
  nextBillingAt?: string | null
  lastBilledAt?: string | null
  lastBillingAmount?: number | null
  pastDueSince?: string | null
  pastDueAttempts?: number | null
}

interface ModuleSub {
  id: string
  moduleKey: string
  status: string
  trialExpiresAt?: string | null
  priceMonthly?: number | null
}

interface AvailableModule {
  moduleKey: string
  label: string
  priceMonthly: number
  pricePerUser: boolean
  pricePerUserAmount: number
}

interface Props {
  brand: Brand
  membership: Membership | null
  moduleSubscriptions: ModuleSub[]
  availableModules?: AvailableModule[]
  currentEstablishments?: number
  currentAdvisors?: number
  currentClients?: number
  currentProducts?: number
  currentSalesThisMonth?: number
  isSuperAdmin?: boolean
}

const MODULE_LABELS: Record<string, string> = {
  menu: 'Menú / Preorden',
  precheckin: 'Pre check-in',
  precheckout: 'Check-out',
  minibar: 'Minibar',
  appointments: 'Citas programadas',
  surveys: 'Encuestas',
  display: 'Pantalla TV',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa', trial: 'En prueba', expired: 'Prueba finalizada', cancelled: 'Cancelada',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', trial: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
}
const BILLING_STATUS_LABELS: Record<string, string> = {
  active: 'Suscripción activa', past_due: 'Pago pendiente',
  suspended: 'Cuenta suspendida', none: 'Sin método de pago',
}
const BILLING_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', past_due: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700', none: 'bg-gray-100 text-gray-500',
}

export function BrandSettings({
  brand: initialBrand,
  membership,
  moduleSubscriptions: initialModuleSubs,
  availableModules = [],
  currentEstablishments = 1,
  currentAdvisors = 0,
  currentClients = 0,
  currentProducts = 0,
  currentSalesThisMonth = 0,
  isSuperAdmin = false,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'profile' | 'membership' | 'integrations'>('profile')
  const [form, setForm] = useState({
    name: initialBrand.name,
    logoUrl: initialBrand.logoUrl || '',
    primaryColor: initialBrand.primaryColor || '#6366f1',
    secondaryColor: initialBrand.secondaryColor || '#7c3aed',
    fontColor: initialBrand.fontColor || '#ffffff',
    address: initialBrand.address || '',
    contactEmail: initialBrand.contactEmail || '',
    website: initialBrand.website || '',
    language: initialBrand.language || 'es',
    country: initialBrand.country || 'Colombia',
    businessType: initialBrand.businessType || 'otros',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null)
  const [moduleSubs, setModuleSubs] = useState<ModuleSub[]>(initialModuleSubs)
  const [cancellingModule, setCancellingModule] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [payingModule, setPayingModule] = useState<string | null>(null)

  const [showCardForm, setShowCardForm] = useState(false)
  const [localBillingStatus, setLocalBillingStatus] = useState(membership?.billingStatus ?? null)
  const [localHasCard, setLocalHasCard] = useState(!!membership?.wompiPaymentSourceId)
  const [localNextBillingAt, setLocalNextBillingAt] = useState(membership?.nextBillingAt ?? null)
  const [localLastBillingAmount, setLocalLastBillingAmount] = useState(membership?.lastBillingAmount ?? null)

  const [upgradingTo, setUpgradingTo] = useState<PlanKey | null>(null)
  const [planChanging, setPlanChanging] = useState(false)
  const [planChangeError, setPlanChangeError] = useState('')
  const [planChangeSaved, setPlanChangeSaved] = useState(false)

  const [extraUserCart, setExtraUserCart] = useState(0)
  const [seatSaving, setSeatSaving] = useState(false)
  const [seatSaved, setSeatSaved] = useState(false)
  const [seatError, setSeatError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    if (tabParam === 'membership' || tabParam === 'integrations' || tabParam === 'profile') {
      setTab(tabParam)
    }
  }, [])

  type ApiKey = { id: string; name: string; keyPrefix: string; active: boolean; createdAt: string; lastUsedAt: string | null }
  const WEBHOOK_EVENTS = ['ticket.created', 'ticket.attended', 'ticket.done', 'ticket.cancelled'] as const
  const WEBHOOK_LABELS: Record<string, string> = {
    'ticket.created': 'Ticket creado', 'ticket.attended': 'Ticket atendido (en atención)',
    'ticket.done': 'Ticket completado', 'ticket.cancelled': 'Ticket cancelado',
  }
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Record<string, { id: string | null; url: string; active: boolean }>>({})
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [keyCreating, setKeyCreating] = useState(false)
  const [webhooksSaving, setWebhooksSaving] = useState(false)
  const [webhooksSaved, setWebhooksSaved] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const loadIntegrations = useCallback(async () => {
    const [keysRes, hooksRes] = await Promise.all([
      fetch('/api/brand/api-keys').then(r => r.json()),
      fetch('/api/brand/webhooks').then(r => r.json()),
    ])
    setApiKeys(keysRes.data ?? [])
    setWebhooks(hooksRes.data ?? {})
    setIntegrationsLoaded(true)
  }, [])

  useEffect(() => {
    if (tab === 'integrations' && !integrationsLoaded) loadIntegrations()
  }, [tab, integrationsLoaded, loadIntegrations])

  async function createApiKey() {
    if (!newKeyName.trim()) return
    setKeyCreating(true)
    const res = await fetch('/api/brand/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    const json = await res.json()
    setKeyCreating(false)
    if (res.ok) { setApiKeys(prev => [json.data, ...prev]); setCreatedKey(json.data.fullKey); setNewKeyName('') }
  }

  async function deleteApiKey(id: string) {
    await fetch(`/api/brand/api-keys/${id}`, { method: 'DELETE' })
    setApiKeys(prev => prev.filter(k => k.id !== id))
  }

  async function saveWebhooks() {
    setWebhooksSaving(true)
    const body = Object.fromEntries(WEBHOOK_EVENTS.map(e => [e, webhooks[e]?.url ?? '']))
    await fetch('/api/brand/webhooks', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setWebhooksSaving(false)
    setWebhooksSaved(true)
    setTimeout(() => setWebhooksSaved(false), 2000)
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).catch(() => null)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    const res = await fetch('/api/admin/marca', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        logoUrl: form.logoUrl || null,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        fontColor: form.fontColor,
        address: form.address || null,
        contactEmail: form.contactEmail || null,
        website: form.website || null,
        language: form.language,
        country: form.country || null,
        businessType: form.businessType,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setSaveError(json.error ?? 'Error al guardar')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handleCancelModule(subId: string) {
    setCancellingModule(subId)
    await fetch(`/api/brand/module-subscriptions/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    setModuleSubs(prev => prev.map(s => s.id === subId ? { ...s, status: 'cancelled' } : s))
    setCancellingModule(null)
    setConfirmCancel(null)
  }

  const verticalKey = initialBrand.activeModules?.__vertical as string | undefined
  const activeVertical = verticalKey ? VERTICALS.find((v: Vertical) => v.key === verticalKey) ?? null : null
  const verticalTrialEndsRaw = initialBrand.activeModules?.__vertical_trial_ends as string | undefined
  const verticalTrialEnds = verticalTrialEndsRaw ? new Date(verticalTrialEndsRaw) : null
  const verticalTrialDaysLeft = verticalTrialEnds
    ? Math.max(0, Math.ceil((verticalTrialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null
  const verticalTrialExpired = verticalTrialEnds ? verticalTrialEnds.getTime() < Date.now() : false

  const currentPlanKey: PlanKey = normalizePlan(membership?.plan)
  const currentPlanDef = PLANS[currentPlanKey]
  const isFreePlan = currentPlanKey === 'free'
  const maxEst = membership?.maxEstablishments ?? currentPlanDef.maxEstablishments
  const maxAdv = membership?.maxAdvisors ?? currentPlanDef.maxUsers
  const planIncludedUsers = currentPlanDef.maxUsers
  const extraUsersActive = Math.max(0, maxAdv - planIncludedUsers)

  const allModuleSubs = moduleSubs.filter(s => ['active', 'trial', 'expired', 'cancelled'].includes(s.status))
  const activeModuleSubs = moduleSubs.filter(s => s.status === 'active')

  const currency: BillingCurrency = (membership?.billingCurrency as BillingCurrency) ?? 'COP'
  const targetPlan = upgradingTo ?? currentPlanKey
  const targetPlanDef = PLANS[targetPlan]
  const cartTotal = targetPlanDef.price + extraUserCart * ADDON_PRICES_COP.extra_user
  const cartTotalCents = toCents(cartTotal)
  const currentMonthlyTotal = currentPlanDef.price + extraUsersActive * ADDON_PRICES_COP.extra_user
  const isFreeWithinLimits = isFreePlan && activeModuleSubs.filter(s => (s.priceMonthly ?? 0) > 0).length === 0

  function getModulePrice(moduleKey: string): number {
    const mod = availableModules.find(m => m.moduleKey === moduleKey)
    return mod?.priceMonthly ?? 0
  }

  function handleCardSuccess(nextBillingAt: string) {
    setLocalHasCard(true)
    setLocalBillingStatus('active')
    setLocalNextBillingAt(nextBillingAt)
    setLocalLastBillingAmount(cartTotalCents)
    setShowCardForm(false)
    router.refresh()
  }

  async function handleChangePlan(newPlan: PlanKey) {
    setPlanChanging(true)
    setPlanChangeError('')
    try {
      const res = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al cambiar plan')
      setPlanChangeSaved(true)
      setTimeout(() => { setPlanChangeSaved(false); setUpgradingTo(null) }, 2000)
      router.refresh()
    } catch (err: unknown) {
      setPlanChangeError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setPlanChanging(false)
    }
  }

  async function handleUpdateExtraUsers() {
    if (extraUserCart === 0) return
    setSeatSaving(true)
    setSeatError('')
    try {
      const newAdv = planIncludedUsers + extraUserCart
      const res = await fetch('/api/billing/update-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEst: maxEst, newAdv }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar')
      setSeatSaved(true)
      setExtraUserCart(0)
      setTimeout(() => setSeatSaved(false), 3000)
      router.refresh()
    } catch (err: unknown) {
      setSeatError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSeatSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi marca</h1>
        <p className="text-gray-500 text-sm mt-1">Configura los datos de tu marca y revisa tu membresía</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {(([
          ['profile', 'Perfil de marca', Building2],
          ['membership', 'Membresía', CreditCard],
          ...(isSuperAdmin || initialBrand.activeModules?.integraciones ? [['integrations', 'Integraciones', Key]] : []),
        ] as [string, string, any][]) ).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col gap-4">
            <Input label="Nombre de la marca" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Tipo de negocio</label>
              <p className="text-xs text-gray-500">Usamos esto para conocerte mejor y adaptar el lenguaje de la plataforma a tu sector.</p>
              <select value={form.businessType} onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <optgroup label="Belleza & Estética">
                  <option value="salon_belleza">Salón de belleza</option>
                  <option value="peluqueria">Peluquería</option>
                  <option value="barberia">Barbería</option>
                  <option value="spa">Spa</option>
                  <option value="salon_unas">Salón de uñas</option>
                  <option value="estetica">Estética / Cosmetología</option>
                  <option value="peluqueria_mascotas">Peluquería de mascotas</option>
                </optgroup>
                <optgroup label="Restaurante & Alimentos">
                  <option value="restaurante">Restaurante</option>
                  <option value="bar_gastropub">Bar / Gastropub</option>
                  <option value="cafeteria">Cafetería</option>
                  <option value="comidas_rapidas">Comidas rápidas</option>
                  <option value="pizzeria">Pizzería</option>
                  <option value="hamburgueseria">Hamburguesería</option>
                  <option value="asadero">Asadero / Parrilla</option>
                  <option value="pasteleria">Pastelería / Panadería</option>
                  <option value="heladeria">Heladería</option>
                  <option value="food_truck">Food truck</option>
                </optgroup>
                <optgroup label="Tienda & Comercio">
                  <option value="tienda_ropa">Tienda de ropa / Boutique</option>
                  <option value="ferreteria">Ferretería</option>
                  <option value="drogueria">Droguería / Farmacia</option>
                  <option value="papeleria">Papelería</option>
                  <option value="miscelanea">Miscelánea / Minimercado</option>
                  <option value="tecnologia">Almacén de tecnología</option>
                  <option value="tienda_mascotas">Tienda de mascotas</option>
                  <option value="libreria">Librería</option>
                </optgroup>
                <optgroup label="Salud & Bienestar">
                  <option value="consultorio_medico">Consultorio médico</option>
                  <option value="clinica">Clínica</option>
                  <option value="odontologia">Odontología</option>
                  <option value="psicologia">Psicología / Terapia</option>
                  <option value="veterinaria">Veterinaria</option>
                  <option value="nutricion">Centro de nutrición</option>
                  <option value="gimnasio">Gimnasio / CrossFit</option>
                </optgroup>
                <optgroup label="Copropiedad & Inmobiliaria">
                  <option value="conjunto_residencial">Conjunto residencial</option>
                  <option value="edificio">Edificio de apartamentos</option>
                  <option value="centro_empresarial">Centro empresarial</option>
                  <option value="parqueadero">Parqueadero</option>
                </optgroup>
                <optgroup label="Consultoría & Servicios Profesionales">
                  <option value="consultoria">Consultoría</option>
                  <option value="agencia_marketing">Agencia de marketing / Diseño</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="contaduria">Contaduría / Finanzas</option>
                  <option value="juridico">Servicios jurídicos</option>
                  <option value="arquitectura">Arquitectura / Ingeniería</option>
                </optgroup>
                <optgroup label="Encargos & Reparación">
                  <option value="lavanderia">Lavandería / Tintorería</option>
                  <option value="zapateria">Zapatería</option>
                  <option value="sastreria">Sastrería / Modistería</option>
                  <option value="reparacion_electronica">Reparación electrónica</option>
                  <option value="relojeria">Relojería</option>
                </optgroup>
                <optgroup label="Hospitalidad & Turismo">
                  <option value="hotel">Hotel boutique</option>
                  <option value="hostal">Hostal</option>
                  <option value="apart_hotel">Apart-hotel</option>
                  <option value="casa_campestre">Casa campestre / Glamping</option>
                </optgroup>
                <optgroup label="Dropshipping & E-commerce">
                  <option value="dropshipping">Dropshipping / Tienda online</option>
                  <option value="importador">Importador / Mayorista</option>
                </optgroup>
                <optgroup label="Otro">
                  <option value="otros">Otro tipo de negocio</option>
                </optgroup>
              </select>
            </div>

            {verticalKey && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Vertical activa</label>
                <p className="text-xs text-gray-500">La vertical define los módulos especializados de tu negocio. No se puede cambiar una vez configurada.</p>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50">
                  <span className="text-sm font-semibold text-indigo-700 capitalize">
                    TurnFlow {verticalKey.charAt(0).toUpperCase() + verticalKey.slice(1)}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                    <Lock size={10} /> bloqueada
                  </span>
                </div>
              </div>
            )}

            <Input label="URL del logo" value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-700">Colores de la marca</p>
              <p className="text-xs text-gray-400 -mt-2">Se usan en formularios públicos, pantalla TV y páginas de turno.</p>
              {([
                { key: 'primaryColor' as const, label: 'Color principal', hint: 'Botones, encabezados y elementos de acción', placeholder: '#6366f1' },
                { key: 'secondaryColor' as const, label: 'Color secundario', hint: 'Fondos de página y pantalla TV', placeholder: '#7c3aed' },
                { key: 'fontColor' as const, label: 'Color de fuente', hint: 'Texto sobre fondos de color de la marca', placeholder: '#ffffff' },
              ]).map(({ key, label, hint, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  {hint && <p className="text-xs text-gray-400">{hint}</p>}
                  <div className="flex items-center gap-2">
                    <input type="color" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 shrink-0" />
                    <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      onBlur={e => {
                        let val = e.target.value.trim()
                        if (val && !val.startsWith('#')) val = '#' + val
                        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
                          setForm(f => ({ ...f, [key]: val.toLowerCase() }))
                        } else {
                          setForm(f => ({ ...f, [key]: form[key] }))
                        }
                      }}
                      maxLength={7} placeholder={placeholder}
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <div className="w-9 h-9 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: form[key] }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Dirección principal" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle 123, Ciudad" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">País</label>
                <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <Input label="Correo de contacto" type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="contacto@marca.com" />
            <Input label="Sitio web" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://www.marca.com" />

            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Globe size={14} className="text-gray-400" /> Idioma de la plataforma
                </label>
                <p className="text-xs text-gray-500 mb-2">El idioma seleccionado se aplicará para todos los usuarios de esta marca.</p>
                <div className="flex gap-2 flex-wrap">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button key={lang.code} type="button" onClick={() => setForm(f => ({ ...f, language: lang.code }))}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        form.language === lang.code
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</div>
            )}
            <div className="pt-2">
              <Button onClick={handleSave} loading={saving}>
                {saved ? <><Check size={15} className="mr-1" /> Guardado</> : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'membership' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border-2 border-indigo-200 p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFreePlan ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                  <CreditCard size={18} className={isFreePlan ? 'text-emerald-600' : 'text-indigo-600'} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Plan actual</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black text-gray-900">{currentPlanDef.name}</span>
                    {localBillingStatus && localBillingStatus !== 'none' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BILLING_STATUS_COLORS[localBillingStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                        {BILLING_STATUS_LABELS[localBillingStatus]}
                      </span>
                    )}
                    {membership && !localBillingStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[membership.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[membership.status] ?? membership.status}
                      </span>
                    )}
                    {isFreePlan && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Sin costo</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{currentPlanDef.description}</p>
                </div>
              </div>
              {!isFreePlan && (
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">{fmtCOP(currentMonthlyTotal)}<span className="text-sm font-normal text-gray-400">/mes</span></p>
                  {localNextBillingAt && (
                    <p className="text-xs text-gray-400 mt-0.5">Próximo cobro {new Date(localNextBillingAt).toLocaleDateString('es', { day: 'numeric', month: 'long' })}</p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Users, label: 'Clientes', used: currentClients, limit: currentPlanDef.maxClients, warn: currentPlanDef.maxClients !== null && currentClients >= currentPlanDef.maxClients * 0.8 },
                { icon: Package, label: 'Productos', used: currentProducts, limit: currentPlanDef.maxProducts, warn: currentPlanDef.maxProducts !== null && currentProducts >= currentPlanDef.maxProducts * 0.8 },
                { icon: ShoppingCart, label: 'Ventas este mes', used: currentSalesThisMonth, limit: currentPlanDef.maxSalesPerMonth, warn: currentPlanDef.maxSalesPerMonth !== null && currentSalesThisMonth >= currentPlanDef.maxSalesPerMonth * 0.8 },
                { icon: Store, label: 'Sucursales', used: currentEstablishments, limit: currentPlanDef.maxEstablishments, warn: currentEstablishments >= currentPlanDef.maxEstablishments },
              ].map(({ icon: Icon, label, used, limit, warn }) => {
                const pct = limit !== null ? Math.min(100, Math.round((used / limit) * 100)) : null
                return (
                  <div key={label} className={`rounded-xl p-3 ${warn ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon size={12} className={warn ? 'text-amber-600' : 'text-gray-400'} />
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{label}</span>
                    </div>
                    <p className={`text-lg font-black ${warn ? 'text-amber-700' : 'text-gray-900'}`}>
                      {used}<span className="text-sm font-normal text-gray-400">/{limit === null ? '∞' : limit}</span>
                    </p>
                    {pct !== null && (
                      <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {activeVertical && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeVertical.colorLight}`}>
                    <Zap size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Vertical activa</p>
                    <p className="font-bold text-gray-900">{activeVertical.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">{fmtCOP(activeVertical.priceMonthly)}<span className="text-sm font-normal text-gray-400">/mes</span></p>
                  {activeVertical.pricingNote && <p className="text-xs text-gray-400 mt-0.5">{activeVertical.pricingNote}</p>}
                </div>
              </div>

              {verticalTrialEnds && (
                <div className={`mx-5 mt-4 rounded-xl px-4 py-3 flex items-start gap-3 ${
                  verticalTrialExpired ? 'bg-red-50 border border-red-200'
                  : verticalTrialDaysLeft! <= 7 ? 'bg-amber-50 border border-amber-200'
                  : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  {verticalTrialExpired
                    ? <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    : <Clock size={16} className={`shrink-0 mt-0.5 ${verticalTrialDaysLeft! <= 7 ? 'text-amber-500' : 'text-emerald-500'}`} />
                  }
                  <div className="flex-1 min-w-0">
                    {verticalTrialExpired ? (
                      <>
                        <p className="text-sm font-bold text-red-700">Tu período de prueba ha vencido</p>
                        <p className="text-xs text-red-600 mt-0.5">Suscríbete al plan vertical para seguir usando {activeVertical?.label} sin interrupciones.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-gray-800">
                          {verticalTrialDaysLeft === 0 ? 'Tu prueba vence hoy' : `${verticalTrialDaysLeft} día${verticalTrialDaysLeft !== 1 ? 's' : ''} restantes en tu prueba`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Prueba gratuita de {activeVertical?.label} · vence el{' '}
                          {verticalTrialEnds.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                        </p>
                      </>
                    )}
                  </div>
                  <a href="#upgrade" className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    verticalTrialExpired ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}>Suscribirse</a>
                </div>
              )}

              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Módulos incluidos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeVertical.modules.filter((m: VerticalModule) => m.included).map((m: VerticalModule) => (
                    <div key={m.key} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle size={13} className="text-emerald-500 shrink-0" /> {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {currentPlanKey !== 'business' && currentPlanKey !== 'enterprise' && (
                <div id="upgrade" className="px-5 pb-5">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-indigo-500" /> Opciones de capacidad
                    </p>
                    <p className="text-xs text-gray-400 mb-3">El precio de la vertical incluye el plan base. Amplía sucursales y usuarios según tus necesidades.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {upgradePlans(currentPlanKey).filter(p => p.key !== 'enterprise').map(plan => {
                        const totalWithVertical = activeVertical.priceMonthly + plan.price
                        return (
                          <div key={plan.key} className={`border-2 rounded-xl p-4 ${plan.highlighted ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-200'}`}>
                            {plan.highlighted && <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">Recomendado</span>}
                            <p className="font-black text-gray-900">{plan.name}</p>
                            <div className="mt-1 mb-2">
                              <p className="text-xs text-gray-400">Plan: <span className="font-semibold text-gray-700">{fmtCOP(plan.price)}/mes</span></p>
                              <p className="text-xs text-gray-400">Vertical: <span className="font-semibold text-gray-700">{fmtCOP(activeVertical.priceMonthly)}/mes</span></p>
                              <p className="text-sm font-black text-indigo-700 mt-1">Total: {fmtCOP(totalWithVertical)}/mes</p>
                            </div>
                            <ul className="flex flex-col gap-1 mb-3">
                              {plan.features.slice(0, 3).map(f => (
                                <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                                  <Check size={11} className="text-indigo-500 shrink-0 mt-0.5" /> {f}
                                </li>
                              ))}
                            </ul>
                            <Button size="sm" variant={plan.highlighted ? 'primary' : 'secondary'} className="w-full" onClick={() => setUpgradingTo(plan.key)}>
                              Contratar {plan.name}
                            </Button>
                          </div>
                        )
                      })}
                      <div className="border-2 border-gray-200 rounded-xl p-4 flex flex-col bg-gradient-to-br from-gray-50 to-slate-50 sm:col-span-2">
                        <p className="font-black text-gray-900">Empresarial</p>
                        <p className="text-sm font-black text-gray-700 mt-0.5">Cotización personalizada</p>
                        <p className="text-xs text-gray-400 mb-3">Múltiples marcas, SLA dedicado y soporte prioritario para grandes compañías.</p>
                        <ul className="flex flex-col gap-1 mb-3">
                          {PLANS.enterprise.features.map(f => (
                            <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                              <CheckCircle size={11} className="text-slate-400 shrink-0 mt-0.5" /> {f}
                            </li>
                          ))}
                        </ul>
                        <a href="https://wa.me/573188474045?text=Hola%2C+quiero+información+sobre+el+plan+Empresarial+de+TurnFlow"
                          target="_blank" rel="noopener noreferrer"
                          className="w-full py-2 rounded-xl font-semibold text-sm text-center bg-gray-900 text-white hover:bg-gray-700 transition-colors">
                          Contactar a ventas
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!activeVertical && currentPlanKey !== 'business' && currentPlanKey !== 'enterprise' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-indigo-500" /> Mejorar plan
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Los planes amplían tu capacidad de <strong>sucursales y usuarios</strong>. Los módulos y verticales se contratan por separado en el Marketplace.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upgradePlans(currentPlanKey).filter(p => p.key !== 'enterprise').map(plan => (
                  <div key={plan.key} className={`border-2 rounded-xl p-4 flex flex-col ${plan.highlighted ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-200'}`}>
                    {plan.highlighted && <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">Recomendado</span>}
                    <p className="font-black text-gray-900 text-lg">{plan.name}</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{fmtCOP(plan.price)}<span className="text-sm font-normal text-gray-400">/mes</span></p>
                    <p className="text-xs text-gray-500 mb-3 mt-0.5">o {fmtCOP(plan.priceAnnual)}/año · 2 meses gratis</p>
                    <ul className="flex flex-col gap-1.5 mb-4 flex-1">
                      {plan.features.slice(0, 4).map(f => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <CheckCircle size={12} className="text-indigo-500 shrink-0 mt-0.5" /> {f}
                        </li>
                      ))}
                    </ul>
                    {upgradingTo === plan.key ? (
                      <div className="space-y-2">
                        {plan.price > 0 && !localHasCard ? (
                          <>
                            <p className="text-xs text-gray-500 text-center">Agrega tu tarjeta para activar el plan {plan.name}</p>
                            <WompiCardForm amountCents={toCents(plan.price)} currency={currency}
                              onSuccess={() => { handleChangePlan(plan.key); handleCardSuccess(localNextBillingAt ?? '') }}
                              onCancel={() => setUpgradingTo(null)} />
                          </>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 text-center">Tu plan cambia a <strong>{plan.name}</strong> · {fmtCOP(plan.price)}/mes</p>
                            {planChangeError && <p className="text-xs text-red-600">{planChangeError}</p>}
                            {planChangeSaved && <p className="text-xs text-green-600 flex items-center gap-1"><Check size={11}/> Plan actualizado</p>}
                            <Button onClick={() => handleChangePlan(plan.key)} loading={planChanging} className="w-full">
                              Confirmar <ArrowRight size={14} className="ml-1" />
                            </Button>
                            <button onClick={() => { setUpgradingTo(null); setPlanChangeError('') }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">Cancelar</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => setUpgradingTo(plan.key)}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${plan.highlighted ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border-2 border-gray-800 text-gray-800 hover:bg-gray-50'}`}>
                        Cambiar a {plan.name}
                      </button>
                    )}
                  </div>
                ))}
                <div className="border-2 border-gray-200 rounded-xl p-4 flex flex-col bg-gradient-to-br from-gray-50 to-slate-50">
                  <p className="font-black text-gray-900 text-lg">Empresarial</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">Pregúntame</p>
                  <p className="text-xs text-gray-400 mb-3 mt-0.5">Cotización personalizada</p>
                  <ul className="flex flex-col gap-1.5 mb-4 flex-1">
                    {PLANS.enterprise.features.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <CheckCircle size={12} className="text-slate-400 shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <a href="https://wa.me/573188474045?text=Hola%2C+quiero+información+sobre+el+plan+Empresarial+de+TurnFlow"
                    target="_blank" rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl font-semibold text-sm text-center bg-gray-900 text-white hover:bg-gray-700 transition-colors">
                    Contactar a ventas
                  </a>
                </div>
              </div>
            </div>
          )}

          {!isFreePlan && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Users size={15} className="text-indigo-500" /> Usuarios adicionales
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Tu plan incluye <strong>{planIncludedUsers} usuario{planIncludedUsers !== 1 ? 's' : ''}</strong>.
                Puedes agregar más por {fmtCOP(ADDON_PRICES_COP.extra_user)}/usuario/mes.
                Actualmente tienes <strong>{currentAdvisors} usuario{currentAdvisors !== 1 ? 's' : ''}</strong> de {maxAdv} permitidos.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setExtraUserCart(v => Math.max(0, v - 1))} disabled={extraUserCart <= 0}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30">
                    <Minus size={13} />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900">{extraUserCart}</span>
                  <button type="button" onClick={() => setExtraUserCart(v => v + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100">
                    <Plus size={13} />
                  </button>
                </div>
                {extraUserCart > 0 && (
                  <span className="text-sm text-indigo-600 font-medium">
                    +{extraUserCart} usuario{extraUserCart !== 1 ? 's' : ''} · +{fmtCOP(extraUserCart * ADDON_PRICES_COP.extra_user)}/mes
                  </span>
                )}
              </div>
              {extraUserCart > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  {seatSaved
                    ? <p className="text-xs text-green-600 flex items-center gap-1"><Check size={11}/> Guardado</p>
                    : <Button onClick={handleUpdateExtraUsers} loading={seatSaving}>Agregar usuarios</Button>
                  }
                  {seatError && <p className="text-xs text-red-600">{seatError}</p>}
                </div>
              )}
            </div>
          )}

          {allModuleSubs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Zap size={15} className="text-indigo-500" /> Módulos adicionales
              </h3>
              <div className="divide-y divide-gray-100">
                {allModuleSubs.map(sub => {
                  const price = getModulePrice(sub.moduleKey)
                  const isExpiredOrCancelled = sub.status === 'expired' || sub.status === 'cancelled'
                  return (
                    <div key={sub.id}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-sm font-medium ${isExpiredOrCancelled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {MODULE_LABELS[sub.moduleKey] ?? sub.moduleKey.replace(/_/g, ' ')}
                          </span>
                          {price > 0 && !isExpiredOrCancelled && <span className="text-xs text-gray-400">{fmtCOP(price)}/mes</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(sub.status === 'trial' || sub.status === 'expired') && (
                            <button onClick={() => setPayingModule(payingModule === sub.id ? null : sub.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                              {payingModule === sub.id ? 'Cerrar' : sub.status === 'expired' ? 'Comprar para seguir usando' : 'Contratar'}
                            </button>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sub.status === 'active' ? 'bg-green-100 text-green-700' :
                            sub.status === 'trial' ? 'bg-amber-100 text-amber-700' :
                            sub.status === 'expired' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'}`}>
                            {sub.status === 'trial' && sub.trialExpiresAt
                              ? `Prueba — vence ${new Date(sub.trialExpiresAt).toLocaleDateString('es')}`
                              : STATUS_LABELS[sub.status] ?? sub.status}
                          </span>
                          {!isExpiredOrCancelled && (
                            <button onClick={() => setConfirmCancel(sub.id)} className="p-1 text-gray-400 hover:text-red-500" title="Cancelar módulo">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {payingModule === sub.id && (
                        <div className="pb-4 border-t border-gray-50 pt-3">
                          <a href={`mailto:soporte@turnflow.com.co?subject=Activar módulo ${MODULE_LABELS[sub.moduleKey] ?? sub.moduleKey}`}
                            className="block w-full py-2 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 text-center">
                            Solicitar activación →
                          </a>
                          <p className="text-[10px] text-gray-400 mt-2 text-center">El equipo de soporte lo activa en minutos.</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <CreditCard size={15} className="text-indigo-500" /> Medio de pago
            </h3>
            {isFreeWithinLimits && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
                <p className="font-medium text-emerald-700 text-sm">Plan gratuito activo</p>
                <p className="text-xs text-emerald-600 mt-0.5">Sin tarjeta requerida. Mejora tu plan para desbloquear más capacidad.</p>
              </div>
            )}
            {!isFreeWithinLimits && localBillingStatus === 'suspended' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Cuenta suspendida</p>
                    <p className="text-xs text-red-600 mt-0.5">Actualiza tu tarjeta para reactivar el acceso.</p>
                  </div>
                </div>
                <WompiCardForm amountCents={cartTotalCents} currency={currency} onSuccess={handleCardSuccess} />
              </div>
            )}
            {!isFreeWithinLimits && localBillingStatus === 'past_due' && !showCardForm && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">Pago pendiente</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {membership?.pastDueAttempts ?? 0} intento{(membership?.pastDueAttempts ?? 0) !== 1 ? 's' : ''} fallido{(membership?.pastDueAttempts ?? 0) !== 1 ? 's' : ''}.
                      {membership?.pastDueSince && ` En mora desde ${new Date(membership.pastDueSince).toLocaleDateString('es')}.`}
                    </p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setShowCardForm(true)}>
                  <RefreshCw size={14} className="mr-2" /> Actualizar tarjeta
                </Button>
              </div>
            )}
            {!isFreeWithinLimits && localBillingStatus === 'past_due' && showCardForm && (
              <WompiCardForm amountCents={cartTotalCents} currency={currency} onSuccess={handleCardSuccess} onCancel={() => setShowCardForm(false)} />
            )}
            {!isFreeWithinLimits && localBillingStatus === 'active' && !showCardForm && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-3">
                  <Check size={15} className="text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800">Suscripción activa</p>
                    {membership?.wompiCustomerEmail && <p className="text-xs text-green-600 truncate">Tarjeta en {membership.wompiCustomerEmail}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center text-sm">
                  {localNextBillingAt && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400">Próximo cobro</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{new Date(localNextBillingAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                      <p className="text-xs text-indigo-600 font-medium">{fmtCOP(currentMonthlyTotal)}</p>
                    </div>
                  )}
                  {localLastBillingAmount != null && localLastBillingAmount > 0 && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400">Último cobro</p>
                      <p className="font-semibold text-gray-800 mt-0.5">
                        {membership?.lastBilledAt ? new Date(membership.lastBilledAt).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : '—'}
                      </p>
                      <p className="text-xs text-gray-500">{fmtCOP(fromCents(localLastBillingAmount))}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowCardForm(true)}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 text-center py-1 flex items-center justify-center gap-1.5">
                  <RefreshCw size={12} /> Actualizar tarjeta
                </button>
              </div>
            )}
            {!isFreeWithinLimits && localBillingStatus === 'active' && showCardForm && (
              <WompiCardForm amountCents={cartTotalCents} currency={currency} onSuccess={handleCardSuccess} onCancel={() => setShowCardForm(false)} />
            )}
            {!isFreeWithinLimits && !localHasCard && localBillingStatus !== 'active' && localBillingStatus !== 'past_due' && localBillingStatus !== 'suspended' && (
              <WompiCardForm amountCents={cartTotalCents} currency={currency} onSuccess={handleCardSuccess} />
            )}
            <div className="flex items-center gap-1.5 mt-4 text-[10px] text-gray-400">
              <Lock size={10} /> Cobros automáticos procesados por Wompi · Visa · Mastercard · IVA incluido
            </div>
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Key size={16} />API Keys</h2>
                <p className="text-xs text-gray-500 mt-0.5">Autenticate con <code className="bg-gray-100 px-1 rounded text-xs">X-API-Key: &lt;tu-clave&gt;</code> en todas las solicitudes a <code className="bg-gray-100 px-1 rounded text-xs">/api/v1/*</code></p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-end gap-3">
              <div className="flex-1">
                <Input label="Nombre de la clave" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="ej. Zapier producción" />
              </div>
              <Button loading={keyCreating} onClick={createApiKey} disabled={!newKeyName.trim()}>
                <Plus size={14} className="mr-1" /> Generar clave
              </Button>
            </div>
            {createdKey && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-green-800 mb-2">✅ Clave generada — cópiala ahora, no se volverá a mostrar</p>
                <div className="flex items-center gap-2 bg-white border border-green-300 rounded-lg px-3 py-2">
                  <code className="flex-1 text-xs font-mono text-gray-900 break-all">{createdKey}</code>
                  <button onClick={() => copyKey(createdKey)} className="shrink-0 p-1.5 rounded-lg hover:bg-green-100 text-green-700" title="Copiar">
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <button onClick={() => setCreatedKey(null)} className="text-xs text-green-700 mt-2 underline">Ya la copié, cerrar</button>
              </div>
            )}
            {!integrationsLoaded ? (
              <p className="text-sm text-gray-400 py-4 text-center">Cargando...</p>
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center bg-white border border-gray-200 rounded-xl">No hay claves API generadas todavía</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {apiKeys.map(k => (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-3">
                    <Key size={14} className={k.active ? 'text-indigo-500' : 'text-gray-300'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{k.name}</p>
                      <p className="text-xs font-mono text-gray-400">{k.keyPrefix}••••••••••••••••••••••</p>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      <p>Creada {new Date(k.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                      {k.lastUsedAt && <p>Usada {new Date(k.lastUsedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {k.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <button onClick={() => deleteApiKey(k.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50" title="Revocar clave">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Webhook size={16} />Webhooks salientes</h2>
              <p className="text-xs text-gray-500 mt-0.5">TurnFlow enviará un POST JSON a estas URLs cuando ocurra cada evento. Deja vacío para deshabilitar.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {WEBHOOK_EVENTS.map(event => (
                <div key={event} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-medium text-gray-900">{WEBHOOK_LABELS[event]}</p>
                    <code className="text-xs text-gray-400">{event}</code>
                  </div>
                  <input type="url" value={webhooks[event]?.url ?? ''}
                    onChange={e => setWebhooks(prev => ({ ...prev, [event]: { ...prev[event], url: e.target.value, id: prev[event]?.id ?? null, active: true } }))}
                    placeholder="https://hooks.zapier.com/..."
                    className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  {webhooks[event]?.url && (
                    <div className={`w-2 h-2 rounded-full shrink-0 ${webhooks[event]?.active ? 'bg-green-400' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button loading={webhooksSaving} onClick={saveWebhooks}>
                {webhooksSaved ? <><Check size={14} className="mr-1" />Guardado</> : 'Guardar webhooks'}
              </Button>
              <p className="text-xs text-gray-400">Los cambios aplican inmediatamente</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Referencia rápida de endpoints</h3>
            <div className="space-y-2 font-mono text-xs text-gray-600">
              {[
                ['GET', '/api/v1/establishments', 'Listar sucursales'],
                ['GET', '/api/v1/tickets?status=waiting', 'Tickets activos'],
                ['POST', '/api/v1/tickets', 'Crear ticket'],
                ['GET', '/api/v1/tickets/:id', 'Estado de un ticket'],
                ['GET', '/api/v1/stats/today', 'Resumen del día'],
              ].map(([method, path, desc]) => (
                <div key={path} className="flex items-center gap-3">
                  <span className={`w-12 text-center font-bold shrink-0 ${method === 'GET' ? 'text-blue-600' : 'text-green-600'}`}>{method}</span>
                  <code className="flex-1 bg-white border border-gray-200 rounded px-2 py-1">{path}</code>
                  <span className="text-gray-400 text-xs">{desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Base URL: <code className="bg-white border border-gray-200 rounded px-1">{typeof window !== 'undefined' ? window.location.origin : 'https://app.turnflow.com.co'}</code></p>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">¿Cancelar módulo?</h2>
            <p className="text-sm text-gray-500 mb-5">El módulo se desactivará al final del período de facturación. No se realizarán más cobros.</p>
            <Button className="w-full mb-2" variant="danger" loading={cancellingModule === confirmCancel} onClick={() => handleCancelModule(confirmCancel)}>
              Confirmar cancelación
            </Button>
            <button onClick={() => setConfirmCancel(null)} className="text-sm text-gray-400 hover:text-gray-600 w-full py-2">Mantener activo</button>
          </div>
        </div>
      )}

      {upgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Ampliar plan</h2>
            <p className="text-sm text-gray-500 mb-5">Contáctanos para ajustar tu plan (más sucursales, usuarios o módulos). Lo activamos en minutos:</p>
            <a href={`mailto:soporte@turnflow.com.co?subject=Quiero ampliar mi plan TurnFlow&body=Hola, soy administrador de la marca "${initialBrand.name}" y quiero ampliar mi plan.`}
              className="block w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors mb-3">
              Contactar soporte →
            </a>
            <a href={`https://wa.me/573001234567?text=Hola%2C+quiero+ampliar+mi+plan+TurnFlow+para+la+marca+${encodeURIComponent(initialBrand.name)}`}
              target="_blank" rel="noopener noreferrer"
              className="block w-full py-2.5 px-4 bg-green-500 text-white rounded-xl font-medium text-sm hover:bg-green-600 transition-colors mb-3">
              Escribir por WhatsApp
            </a>
            <button onClick={() => setUpgradeModal(null)} className="text-sm text-gray-400 hover:text-gray-600">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
