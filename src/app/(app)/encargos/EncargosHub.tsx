'use client'

import { useState, useMemo } from 'react'
import {
  Package, Plus, X, Search, Check, Truck,
  Clock, AlertCircle, Edit2, Trash2, Loader2, Copy, CheckCheck, ExternalLink, Mail, QrCode, UserPlus,
} from 'lucide-react'
import { buildWaMessage, WA_TEMPLATE_DEFS } from '@/lib/waTemplates'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EncargoService {
  id: string
  brandId: string
  name: string
  description: string | null
  price: number
  durationDays: number
  isActive: boolean
  sortOrder: number
}

interface Encargo {
  id: string
  brandId: string
  customerId: string | null
  orderCode: string
  serviceId: string | null
  itemDescription: string
  itemColor: string | null
  itemBrand: string | null
  initialNotes: string | null
  photoUrl?: string | null
  status: 'received' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
  receivedAt: string
  promisedDate: string
  readyAt: string | null
  deliveredAt: string | null
  price: number
  paid: boolean
  notifyWhatsapp: boolean
  notifiedAt: string | null
  customerEmail: string | null
  advisorId: string | null
  notes: string | null
  // Joined
  customerName: string | null
  customerPhone: string | null
  customerCelular: string | null
  advisorName: string | null
  serviceName: string | null
}

interface Customer {
  id: string
  name: string
  phone: string | null
  celular?: string | null
  email?: string | null
}

interface Advisor { id: string; name: string }
interface CatalogProduct { id: string; name: string; price: number; productType: string }

interface ServiceOption {
  id: string
  name: string
  price: number
  source: 'encargo_service' | 'product'
  durationDays?: number
}

interface EncargoItem {
  id?: string
  sourceId: string
  name: string
  quantity: number
  unitPrice: number
}

interface Props {
  brandId: string
  services: EncargoService[]
  encargos: Encargo[]
  customers: Customer[]
  advisors: Advisor[]
  catalogProducts: CatalogProduct[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const STATUS_CONFIG: Record<Encargo['status'], { label: string; color: string; icon: any }> = {
  received:    { label: 'Recibido',     color: 'bg-blue-100 text-blue-700',       icon: Package },
  in_progress: { label: 'En proceso',   color: 'bg-amber-100 text-amber-700',     icon: Clock },
  ready:       { label: 'Listo',        color: 'bg-emerald-100 text-emerald-700', icon: Check },
  delivered:   { label: 'Entregado',    color: 'bg-gray-100 text-gray-500',       icon: Truck },
  cancelled:   { label: 'Cancelado',    color: 'bg-red-100 text-red-400',         icon: X },
}

const NEXT_STATUS: Partial<Record<Encargo['status'], Encargo['status']>> = {
  received: 'in_progress',
  in_progress: 'ready',
  ready: 'delivered',
}

// ─── NewEncargoModal ──────────────────────────────────────────────────────────

function NewEncargoModal({ brandId, services, customers, advisors, catalogProducts, onClose, onSaved }: {
  brandId: string
  services: EncargoService[]
  customers: Customer[]
  advisors: Advisor[]
  catalogProducts: CatalogProduct[]
  onClose: () => void
  onSaved: (e: Encargo) => void
}) {
  const [form, setForm] = useState({
    customerId: '',
    itemDescription: '',
    itemColor: '',
    itemBrand: '',
    initialNotes: '',
    promisedDate: '',
    advisorId: '',
    notifyWhatsapp: true,
    notes: '',
    customerEmail: '',
  })
  const [items, setItems] = useState<EncargoItem[]>([
    { sourceId: '', name: '', quantity: 1, unitPrice: 0 },
  ])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [generatedCode] = useState(generateCode)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Inline customer creation
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })
  const [customerList, setCustomerList] = useState<Customer[]>(customers)
  const setNC = (k: string, v: string) => setNewCustomer(p => ({ ...p, [k]: v }))

  async function saveNewCustomer() {
    if (!newCustomer.name.trim()) return
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim() || null,
        email: newCustomer.email.trim() || null,
        canalContacto: 'Presencial',
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.data) {
      setSaveError('No se pudo crear el cliente: ' + (json.error ?? 'Error desconocido'))
      return
    }
    const created = json.data as Customer
    setCustomerList(prev => [created, ...prev])
    set('customerId', created.id)
    if (newCustomer.email.trim()) set('customerEmail', newCustomer.email.trim())
    setCreatingCustomer(false)
    setNewCustomer({ name: '', phone: '', email: '' })
  }

  const allOptions: ServiceOption[] = [
    ...services.filter(s => s.isActive).map(s => ({
      id: s.id, name: s.name, price: Number(s.price),
      source: 'encargo_service' as const, durationDays: s.durationDays,
    })),
    ...catalogProducts.map(p => ({
      id: p.id, name: p.name, price: Number(p.price),
      source: 'product' as const,
    })),
  ]

  const totalPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  function onItemServiceChange(idx: number, optKey: string) {
    if (!optKey) {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, sourceId: '', name: '', unitPrice: 0 } : it))
      return
    }
    const opt = allOptions.find(o => `${o.source}:${o.id}` === optKey)
    if (!opt) return
    setItems(prev => prev.map((it, i) => i === idx ? {
      ...it, sourceId: opt.id, name: opt.name, unitPrice: opt.price,
    } : it))
    if (idx === 0 && !form.promisedDate && opt.durationDays) {
      setForm(f => ({
        ...f,
        promisedDate: new Date(Date.now() + opt.durationDays! * 86400000).toISOString().split('T')[0],
      }))
    }
  }

  function addItem() {
    setItems(prev => [...prev, { sourceId: '', name: '', quantity: 1, unitPrice: 0 }])
  }
  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    if (!form.itemDescription || !form.promisedDate) return
    const validItems = items.filter(it => it.name.trim())
    setSaving(true)
    setSaveError(null)

    const firstEncargoServiceItem = validItems.find(it => {
      if (!it.sourceId) return false
      return allOptions.find(o => o.id === it.sourceId)?.source === 'encargo_service'
    })

    const res = await fetch('/api/encargos/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderCode: generatedCode,
        customerId: form.customerId || null,
        serviceId: firstEncargoServiceItem?.sourceId ?? null,
        itemDescription: form.itemDescription,
        itemColor: form.itemColor || null,
        itemBrand: form.itemBrand || null,
        initialNotes: form.initialNotes || null,
        promisedDate: form.promisedDate,
        price: totalPrice,
        advisorId: form.advisorId || null,
        notifyWhatsapp: form.notifyWhatsapp,
        notes: form.notes || null,
        customerEmail: form.customerEmail.trim() || null,
        items: validItems.map((it, idx) => ({
          sourceType: it.sourceId
            ? (allOptions.find(o => o.id === it.sourceId)?.source ?? 'custom')
            : 'custom',
          sourceId: it.sourceId || null,
          name: it.name.trim(),
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          sortOrder: idx,
        })),
      }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok || !json.encargoId) {
      setSaving(false)
      setSaveError(json.detail ?? json.error ?? 'No se pudo guardar el encargo.')
      return
    }

    // Re-fetch full record with joins
    const fetchRes = await fetch(`/api/encargos/${json.encargoId}`)
    const fetchJson = await fetchRes.json().catch(() => ({}))

    setSaving(false)
    if (!fetchRes.ok || !fetchJson.encargo) {
      setSaveError('Encargo guardado, pero no se pudo cargar. Recarga la página.')
      return
    }
    onSaved(fetchJson.encargo as Encargo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Nuevo encargo</h3>
            <p className="text-xs text-gray-400 mt-0.5">Código: <span className="font-mono font-bold text-indigo-600">{generatedCode}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {saveError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Customer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">Cliente</label>
              <button type="button"
                onClick={() => setCreatingCustomer(v => !v)}
                className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline">
                <UserPlus size={11} />
                {creatingCustomer ? 'Cancelar' : 'Nuevo cliente'}
              </button>
            </div>

            {creatingCustomer ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">Crear cliente nuevo</p>
                <input type="text" placeholder="Nombre *"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={newCustomer.name} onChange={e => setNC('name', e.target.value)} />
                <input type="tel" placeholder="Teléfono / WhatsApp"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={newCustomer.phone} onChange={e => setNC('phone', e.target.value)} />
                <input type="email" placeholder="Correo electrónico"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={newCustomer.email} onChange={e => setNC('email', e.target.value)} />
                <button type="button" onClick={saveNewCustomer} disabled={!newCustomer.name.trim()}
                  className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-40">
                  Guardar y seleccionar cliente
                </button>
              </div>
            ) : (
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                value={form.customerId}
                onChange={e => {
                  const id = e.target.value
                  set('customerId', id)
                  const found = customerList.find(c => c.id === id)
                  if (found?.email) set('customerEmail', found.email)
                }}>
                <option value="">Sin cliente registrado</option>
                {customerList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.phone ? ` · ${c.phone}` : ''}{c.email ? ` · ${c.email}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              <span className="flex items-center gap-1"><Mail size={11} /> Correo para notificación (opcional)</span>
            </label>
            <input type="email" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)}
              placeholder="cliente@ejemplo.com" />
            <p className="text-[10px] text-gray-400 mt-0.5">Se envía un correo automático cuando el encargo esté listo</p>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Servicios a realizar *</label>
              <button type="button" onClick={addItem}
                className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                <Plus size={12} /> Agregar servicio
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                      value={item.sourceId ? `${allOptions.find(o => o.id === item.sourceId)?.source}:${item.sourceId}` : ''}
                      onChange={e => onItemServiceChange(idx, e.target.value)}
                    >
                      <option value="">— Seleccionar del catálogo —</option>
                      {services.filter(s => s.isActive).length > 0 && (
                        <optgroup label="Servicios de encargos">
                          {services.filter(s => s.isActive).map(s => (
                            <option key={s.id} value={`encargo_service:${s.id}`}>{s.name} · {fmtCOP(Number(s.price))}</option>
                          ))}
                        </optgroup>
                      )}
                      {catalogProducts.length > 0 && (
                        <optgroup label="Catálogo de ventas">
                          {catalogProducts.map(p => (
                            <option key={p.id} value={`product:${p.id}`}>{p.name} · {fmtCOP(Number(p.price))}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)}
                        className="p-1 text-red-400 hover:text-red-600 shrink-0">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Nombre / detalle</label>
                      <input type="text" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                        value={item.name} onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                        placeholder="Ej: Lavado seco" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Cantidad</label>
                      <input type="number" min={1} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                        value={item.quantity} onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, +e.target.value) } : it))} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Precio unit.</label>
                      <input type="number" min={0} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                        value={item.unitPrice || ''} onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: +e.target.value } : it))}
                        placeholder="0" />
                    </div>
                  </div>
                  {item.quantity > 0 && item.unitPrice > 0 && (
                    <p className="text-right text-xs text-indigo-600 font-semibold">
                      Subtotal: {fmtCOP(item.quantity * item.unitPrice)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {totalPrice > 0 && (
              <div className="mt-2 flex justify-between items-center bg-indigo-50 rounded-xl px-4 py-2.5">
                <span className="text-sm font-semibold text-indigo-700">Total del encargo</span>
                <span className="text-lg font-black text-indigo-700">{fmtCOP(totalPrice)}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción del artículo *</label>
            <input type="text" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={form.itemDescription} onChange={e => set('itemDescription', e.target.value)}
              placeholder="Ej: Vestido negro de seda con bordados, Zapatos Oxford café" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Color</label>
              <input type="text" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                value={form.itemColor} onChange={e => set('itemColor', e.target.value)} placeholder="Ej: Negro" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Marca</label>
              <input type="text" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                value={form.itemBrand} onChange={e => set('itemBrand', e.target.value)} placeholder="Ej: Zara" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Estado al recibir / notas iniciales</label>
            <textarea rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
              value={form.initialNotes} onChange={e => set('initialNotes', e.target.value)}
              placeholder="Ej: Mancha en la manga derecha, botón faltante en la parte trasera" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de entrega prometida *</label>
              <input type="date" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                value={form.promisedDate} onChange={e => set('promisedDate', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Asignar a</label>
            <select className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={form.advisorId} onChange={e => set('advisorId', e.target.value)}>
              <option value="">Sin asignar</option>
              {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
            <input type="checkbox" id="notify_wa" checked={form.notifyWhatsapp}
              onChange={e => set('notifyWhatsapp', e.target.checked)} className="rounded" />
            <label htmlFor="notify_wa" className="text-sm text-green-800 font-medium">
              Notificar por WhatsApp cuando esté listo
            </label>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={save} disabled={saving || !form.itemDescription || !form.promisedDate}
            className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40">
            {saving ? 'Registrando…' : 'Registrar encargo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EncargoCard ──────────────────────────────────────────────────────────────

function EncargoCard({ encargo, onUpdate }: { encargo: Encargo; onUpdate: (e: Encargo) => void }) {
  const [advancing, setAdvancing] = useState(false)
  const [copied, setCopied] = useState(false)
  const cfg = STATUS_CONFIG[encargo.status]
  const Icon = cfg.icon
  const nextStatus = NEXT_STATUS[encargo.status]
  const isOverdue = encargo.status !== 'delivered' && encargo.status !== 'cancelled'
    && new Date(encargo.promisedDate) < new Date()

  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/encargo/${encargo.orderCode}`

  async function advance() {
    if (!nextStatus) return
    setAdvancing(true)

    let data: Encargo | null = null

    if (nextStatus === 'delivered') {
      const res = await fetch('/api/encargos/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encargoId: encargo.id }),
      })
      const json = await res.json()
      data = json.encargo ?? null
    } else {
      const patch: Record<string, any> = { status: nextStatus }
      if (nextStatus === 'ready') patch.readyAt = new Date().toISOString()

      const res = await fetch(`/api/encargos/${encargo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      data = json.encargo ?? null
    }

    setAdvancing(false)
    if (data) {
      onUpdate(data as Encargo)
      if (nextStatus === 'ready' && encargo.notifyWhatsapp) {
        const phone = encargo.customerCelular || encargo.customerPhone
        if (phone) {
          const tmplDef = WA_TEMPLATE_DEFS.find(t => t.category === 'encargo_listo')
          const template = tmplDef?.defaultBody ?? ''
          let msg = template
          msg = msg.replace(/{{nombre}}/g, encargo.customerName ?? 'Cliente')
          msg = msg.replace(/{{articulo}}/g, encargo.itemDescription)
          msg = msg.replace(/{{codigo}}/g, encargo.orderCode)
          msg = msg.replace(/{{total}}/g, fmtCOP(Number(encargo.price)))
          const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`
          window.open(waUrl, '_blank')
        }
      }
      if (nextStatus === 'ready' && encargo.customerEmail) {
        fetch('/api/encargos/notify-ready', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            encargoId: encargo.id,
            customerEmail: encargo.customerEmail,
            customerName: encargo.customerName ?? 'Cliente',
            itemDescription: encargo.itemDescription,
            orderCode: encargo.orderCode,
            total: encargo.price,
            portalUrl,
          }),
        }).catch(err => console.warn('[encargos] email notify error:', err))
      }
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(encargo.orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-900 truncate">{encargo.itemDescription}</p>
              {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold flex items-center gap-1"><AlertCircle size={9} />Vencido</span>}
            </div>
            {encargo.serviceName && <p className="text-xs text-gray-500">{encargo.serviceName}</p>}
            {(encargo.itemColor || encargo.itemBrand) && (
              <p className="text-xs text-gray-400">{[encargo.itemColor, encargo.itemBrand].filter(Boolean).join(' · ')}</p>
            )}
            {encargo.customerName && <p className="text-xs text-gray-500 mt-0.5">👤 {encargo.customerName}</p>}
          </div>
          <div className="text-right shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
            <p className="text-sm font-bold text-gray-900 mt-1">{fmtCOP(Number(encargo.price))}</p>
            {encargo.paid && <p className="text-[10px] text-emerald-600 font-semibold">Pagado</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
          <button onClick={copyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
            <span className="font-mono text-sm font-bold text-gray-700">{encargo.orderCode}</span>
            {copied ? <CheckCheck size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
          </button>
          <div className="flex-1 text-right">
            <p className="text-[10px] text-gray-400">Entrega: <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>{fmt(encargo.promisedDate)}</span></p>
            <p className="text-[10px] text-gray-400">Recibido: {fmt(encargo.receivedAt)}</p>
          </div>
        </div>
      </div>

      {encargo.status !== 'delivered' && encargo.status !== 'cancelled' && (
        <div className="px-4 pb-4 flex gap-2">
          <a href={portalUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <QrCode size={12} /> Portal
          </a>
          {nextStatus && (
            <button onClick={advance} disabled={advancing}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                nextStatus === 'ready' ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : nextStatus === 'delivered' ? 'bg-gray-700 text-white hover:bg-gray-800'
                : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}>
              {advancing ? <Loader2 size={12} className="animate-spin" /> : null}
              {nextStatus === 'in_progress' ? '→ Marcar en proceso'
                : nextStatus === 'ready' ? '✓ Marcar listo'
                : '📦 Entregar y registrar venta'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── EncargosHub ──────────────────────────────────────────────────────────────

type Tab = 'activos' | 'todos' | 'servicios'
const STATUS_FILTERS = ['received', 'in_progress', 'ready'] as const

export function EncargosHub({ brandId, services: initServices, encargos: initEncargos, customers, advisors, catalogProducts }: Props) {
  const [tab, setTab] = useState<Tab>('activos')
  const [services, setServices] = useState(initServices)
  const [encargos, setEncargos] = useState(initEncargos)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  const received   = encargos.filter(e => e.status === 'received').length
  const inProgress = encargos.filter(e => e.status === 'in_progress').length
  const ready      = encargos.filter(e => e.status === 'ready').length
  const overdue    = encargos.filter(e =>
    !['delivered','cancelled'].includes(e.status) && new Date(e.promisedDate) < new Date()
  ).length

  const filtered = useMemo(() => {
    let list = tab === 'activos'
      ? encargos.filter(e => STATUS_FILTERS.includes(e.status as any))
      : encargos
    if (search) list = list.filter(e =>
      e.itemDescription.toLowerCase().includes(search.toLowerCase()) ||
      e.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      (e.customerName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
    return list
  }, [encargos, tab, search])

  function handleUpdate(updated: Encargo) {
    setEncargos(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const TABS = [
    { key: 'activos' as Tab,   label: `Activos (${received + inProgress + ready})`, icon: Package },
    { key: 'todos' as Tab,     label: 'Todos',     icon: Clock },
    { key: 'servicios' as Tab, label: 'Servicios', icon: Edit2 },
  ]

  return (
    <div className="px-0 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center">
          <Package size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">TurnFlow Encargos</h1>
          <p className="text-sm text-gray-500">Lavanderías, zapaterías y sastrerías</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600">
          <Plus size={15} /> Nuevo encargo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-center">
          <p className="text-xl font-bold text-blue-700">{received}</p>
          <p className="text-[11px] text-blue-600 font-semibold">Recibidos</p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-center">
          <p className="text-xl font-bold text-amber-700">{inProgress}</p>
          <p className="text-[11px] text-amber-600 font-semibold">En proceso</p>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
          <p className="text-xl font-bold text-emerald-700">{ready}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Listos</p>
        </div>
        <div className={`p-3 rounded-2xl border text-center ${overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
          <p className={`text-xl font-bold ${overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{overdue}</p>
          <p className={`text-[11px] font-semibold ${overdue > 0 ? 'text-red-500' : 'text-gray-400'}`}>Vencidos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {(tab === 'activos' || tab === 'todos') && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por código, artículo o cliente…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:outline-none"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium text-gray-500">{tab === 'activos' ? 'Sin encargos activos' : 'Sin encargos'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(e => (
                <EncargoCard key={e.id} encargo={e} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'servicios' && (
        <ServiceManager
          services={services}
          brandId={brandId}
          onUpdate={setServices}
        />
      )}

      {showNew && (
        <NewEncargoModal
          brandId={brandId} services={services} customers={customers} advisors={advisors}
          catalogProducts={catalogProducts}
          onClose={() => setShowNew(false)}
          onSaved={e => { setEncargos(prev => [e, ...prev]); setShowNew(false) }}
        />
      )}
    </div>
  )
}

// ─── ServiceManager ───────────────────────────────────────────────────────────

function ServiceManager({ services, brandId, onUpdate }: {
  services: EncargoService[]
  brandId: string
  onUpdate: (s: EncargoService[]) => void
}) {
  const [form, setForm] = useState({ name: '', price: '', durationDays: '3', description: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function addService() {
    if (!form.name || !form.price) return
    setSaving(true)
    const res = await fetch('/api/encargos/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        price: parseFloat(form.price),
        durationDays: parseInt(form.durationDays) || 3,
        description: form.description || null,
        sortOrder: services.length,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (res.ok && json.service) {
      onUpdate([...services, json.service as EncargoService])
      setForm({ name: '', price: '', durationDays: '3', description: '' })
    }
  }

  async function toggleService(id: string, isActive: boolean) {
    const res = await fetch(`/api/encargos/services`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    })
    if (res.ok) {
      onUpdate(services.map(s => s.id === id ? { ...s, isActive } : s))
    }
  }

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Agregar servicio</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <input type="text" placeholder="Nombre del servicio *" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <input type="number" placeholder="Precio (COP) *" className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            value={form.price} onChange={e => set('price', e.target.value)} />
          <div className="relative">
            <input type="number" placeholder="Días estimados" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={form.durationDays} onChange={e => set('durationDays', e.target.value)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">días</span>
          </div>
        </div>
        <button onClick={addService} disabled={saving || !form.name || !form.price}
          className="w-full py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 flex items-center justify-center gap-2">
          <Plus size={14} /> Agregar servicio
        </button>
      </div>

      <div className="space-y-2">
        {services.map(s => (
          <div key={s.id} className={`flex items-center gap-3 p-4 rounded-2xl border ${s.isActive ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{s.name}</p>
              <p className="text-xs text-gray-400">{fmtCOP(Number(s.price))} · {s.durationDays} días estimados</p>
            </div>
            <button onClick={() => toggleService(s.id, !s.isActive)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-colors ${
                s.isActive ? 'border-gray-200 text-gray-500 hover:bg-gray-100' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}>
              {s.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">Sin servicios configurados</p>
        )}
      </div>
    </div>
  )
}
