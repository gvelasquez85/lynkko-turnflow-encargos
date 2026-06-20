'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, UserCheck, UserPlus, RotateCcw, Search,
  Phone, Mail, Building2, Calendar, TrendingUp, Star,
  ChevronDown, ChevronUp, X, Plus, Edit2, Check,
  MessageSquare, Tag, Clock, FileText, ChevronRight,
  Cake, Wifi, Smartphone, Save, Loader2, ShoppingCart, CalendarCheck,
  Sparkles, Copy, RefreshCw, Send, MessageCircle, Upload, ExternalLink,
} from 'lucide-react'
import { buildWaMessage, WA_TEMPLATE_BY_CATEGORY } from '@/lib/waTemplates'
import { BulkUploadModal } from '@/components/BulkUploadModal'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  name: string
  phone: string | null
  celular: string | null
  email: string | null
  documentId: string | null
  canalContacto: string | null
  intereses: string[] | null
  cumpleanos: string | null
  ultimaCompra: string | null
  firstVisitAt: string
  lastVisitAt: string
  totalVisits: number
  establishmentIds: string[]
}

interface CustomerTag {
  id: string
  customerId: string
  tagKey: string
}

interface CustomerHistoryItem {
  id: string
  customerId: string
  tipo: string
  fecha: string
  detalles: string | null
}

interface Establishment {
  id: string
  name: string
}

interface Props {
  brandId: string
  businessType?: string
  brandName?: string
  initialCustomers: Customer[]
  establishments: Establishment[]
  waTemplates?: { category: string; body: string }[]
}

// Business-type vocabulary
const BIZ_VOCAB: Record<string, { client: string; clients: string; service: string; newClient: string }> = {
  belleza:     { client: 'clienta',  clients: 'clientas',  service: 'servicio', newClient: 'Nueva clienta' },
  restaurante: { client: 'cliente',  clients: 'clientes',  service: 'pedido',   newClient: 'Nuevo cliente' },
  ferreteria:  { client: 'cliente',  clients: 'clientes',  service: 'orden',    newClient: 'Nuevo cliente' },
  tienda:      { client: 'cliente',  clients: 'clientes',  service: 'compra',   newClient: 'Nuevo cliente' },
  servicios:   { client: 'cliente',  clients: 'clientes',  service: 'servicio', newClient: 'Nuevo cliente' },
  otros:       { client: 'cliente',  clients: 'clientes',  service: 'venta',    newClient: 'Nuevo cliente' },
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREDEFINED_TAGS: { key: string; label: string; color: string }[] = [
  { key: 'cliente_frecuente', label: 'Frecuente', color: 'bg-green-100 text-green-700' },
  { key: 'cliente_nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
  { key: 'cliente_inactivo', label: 'Inactivo', color: 'bg-gray-100 text-gray-500' },
  { key: 'pregunto_pero_no_compro', label: 'Preguntó / no compró', color: 'bg-amber-100 text-amber-700' },
  { key: 'requiere_seguimiento', label: 'Requiere seguimiento', color: 'bg-orange-100 text-orange-700' },
  { key: 'cliente_premium', label: 'Premium', color: 'bg-purple-100 text-purple-700' },
  { key: 'debe_volver_30_dias', label: 'Volver en 30 días', color: 'bg-rose-100 text-rose-700' },
]

const CANAL_OPTIONS = ['WhatsApp', 'Llamada', 'Email', 'Presencial', 'Instagram', 'Otro']

const INTERES_BY_VERTICAL: Record<string, string[]> = {
  belleza: [
    'Corte de cabello', 'Tinte / Color', 'Manicure', 'Pedicure',
    'Tratamiento capilar', 'Depilación', 'Masajes', 'Faciales',
    'Uñas acrílicas / semipermanentes', 'Alisado / Keratina',
  ],
  restaurante: [
    'Desayunos', 'Almuerzos ejecutivos', 'Comida rápida', 'Postres',
    'Bebidas / Jugos', 'Domicilios', 'Eventos / Catering',
    'Menú vegetariano', 'Comida saludable', 'Café de especialidad',
  ],
  ferreteria: [
    'Electricidad', 'Plomería', 'Pintura', 'Herramientas',
    'Cerrajería', 'Soldadura', 'Tornillería', 'Materiales de construcción',
    'Reparación de equipos', 'Mantenimiento preventivo',
  ],
  tienda: [
    'Ropa mujer', 'Ropa hombre', 'Accesorios', 'Calzado',
    'Productos para mascotas', 'Papelería', 'Tecnología',
    'Hogar y decoración', 'Productos de belleza', 'Regalos',
  ],
  servicios: [
    'Consultoría', 'Asesoría legal', 'Contabilidad', 'Diseño gráfico',
    'Desarrollo web', 'Marketing digital', 'Capacitación',
    'Salud / Terapia', 'Fotografía', 'Transporte / Logística',
  ],
  otros: [
    'Producto principal', 'Servicio básico', 'Asesoría', 'Mantenimiento',
    'Instalación', 'Reparación', 'Consulta', 'Paquete premium',
    'Suscripción mensual', 'Servicio a domicilio',
  ],
}

function getInteresOptions(businessType: string): string[] {
  return INTERES_BY_VERTICAL[businessType] ?? INTERES_BY_VERTICAL.otros
}

function tagInfo(key: string) {
  return PREDEFINED_TAGS.find(t => t.key === key) ?? { key, label: key, color: 'bg-gray-100 text-gray-500' }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function visitTag(totalVisits: number): { label: string; color: string } {
  if (totalVisits === 1) return { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' }
  if (totalVisits <= 3) return { label: 'Ocasional', color: 'bg-amber-100 text-amber-700' }
  if (totalVisits <= 9) return { label: 'Frecuente', color: 'bg-green-100 text-green-700' }
  return { label: 'Fiel', color: 'bg-purple-100 text-purple-700' }
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function fmt(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ─── Inline Quick-Edit Row ───────────────────────────────────────────────────

function InlineField({
  label, value, type = 'text', onSave,
}: { label: string; value: string | null | undefined; type?: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onSave(val)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type={type}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="text-xs border border-indigo-300 rounded-lg px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button onClick={save} disabled={saving} className="p-1 rounded text-indigo-600 hover:bg-indigo-100 disabled:opacity-50">
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
        </button>
        <button onClick={() => setEditing(false)} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={11} /></button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setVal(value ?? ''); setEditing(true) }}
      className="flex items-center gap-1 group text-left"
    >
      <span className="text-xs text-gray-500">{label}:</span>
      <span className={`text-xs font-medium ${value ? 'text-gray-800' : 'text-gray-300 italic'}`}>{value || 'Agregar'}</span>
      <Edit2 size={9} className="text-gray-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

function CustomerExpandedRow({
  customer, establishments, brandName, onUpdate, colSpan,
}: {
  customer: Customer
  establishments: Establishment[]
  brandName: string
  onUpdate: (c: Customer) => void
  colSpan: number
}) {
  const phone = customer.celular || customer.phone

  async function patchCustomer(patch: Record<string, unknown>) {
    const res = await fetch(`/api/clientes/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.data) onUpdate({ ...customer, ...json.data })
    }
  }

  const waUrl = phone ? buildWaMessage('', {}, phone) : null

  return (
    <tr className="bg-gradient-to-b from-indigo-50/60 to-white border-b border-indigo-100">
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick edit fields */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <InlineField
              label="Teléfono"
              value={customer.phone}
              type="tel"
              onSave={v => patchCustomer({ phone: v || null })}
            />
            <InlineField
              label="Celular / WA"
              value={customer.celular}
              type="tel"
              onSave={v => patchCustomer({ celular: v || null })}
            />
            <InlineField
              label="Email"
              value={customer.email}
              type="email"
              onSave={v => patchCustomer({ email: v || null })}
            />
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
            <Link
              href={`/clientes/${customer.id}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink size={12} /> Ver perfil completo
            </Link>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── SlideOver ───────────────────────────────────────────────────────────────

type Tab = 'perfil' | 'etiquetas' | 'historial' | 'notas' | 'mensaje'

function CustomerSlideOver({
  customer,
  establishments,
  onClose,
  onUpdate,
  businessType = 'otros',
  waTemplates = [],
  brandName = 'Tu negocio',
}: {
  customer: Customer
  establishments: Establishment[]
  onClose: () => void
  onUpdate: (c: Customer) => void
  businessType?: string
  waTemplates?: { category: string; body: string }[]
  brandName?: string
}) {
  const [tab, setTab] = useState<Tab>('perfil')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...customer })
  const [saving, setSaving] = useState(false)
  const [tags, setTags] = useState<CustomerTag[]>([])
  const [history, setHistory] = useState<CustomerHistoryItem[]>([])
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [loadingTabs, setLoadingTabs] = useState(false)
  const [customTagInput, setCustomTagInput] = useState('')
  const [contactMsgType, setContactMsgType] = useState('reactivation')
  const [contactMsgIndex, setContactMsgIndex] = useState(0)
  const [contactMsgCopied, setContactMsgCopied] = useState(false)

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])
  const waTemplateMap = useMemo(() => Object.fromEntries(waTemplates.map(t => [t.category, t.body])), [waTemplates])

  function openReactivationWa() {
    const phone = customer.celular || customer.phone
    if (!phone) return
    const body = waTemplateMap['customer_reactivation'] ?? WA_TEMPLATE_BY_CATEGORY['customer_reactivation']?.defaultBody ?? ''
    const url = buildWaMessage(body, { nombre: customer.name, negocio: brandName }, phone)
    window.open(url, '_blank')
  }

  const loadTabData = useCallback(async () => {
    if (tab === 'etiquetas' || tab === 'historial' || tab === 'notas') {
      setLoadingTabs(true)

      if (tab === 'etiquetas') {
        const res = await fetch(`/api/clientes/${customer.id}/tags`)
        if (res.ok) {
          const json = await res.json()
          setTags(json.data ?? [])
        }
      } else {
        const res = await fetch(`/api/clientes/${customer.id}/history`)
        if (res.ok) {
          const json = await res.json()
          setHistory(json.data ?? [])
        }
      }
      setLoadingTabs(false)
    }
  }, [tab, customer.id])

  useEffect(() => { loadTabData() }, [loadTabData])

  async function handleSave() {
    setSaving(true)
    const patch: Record<string, unknown> = {
      name: form.name,
      phone: form.phone || null,
      celular: form.celular || null,
      email: form.email || null,
      documentId: form.documentId || null,
      canalContacto: form.canalContacto || null,
      cumpleanos: form.cumpleanos || null,
      intereses: form.intereses ?? [],
    }
    const res = await fetch(`/api/clientes/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSaving(false)
    setEditing(false)
    if (res.ok) {
      const json = await res.json()
      if (json.data) onUpdate({ ...customer, ...json.data })
    }
  }

  async function toggleTag(tagKey: string) {
    const existing = tags.find(t => t.tagKey === tagKey)
    if (existing) {
      await fetch(`/api/clientes/${customer.id}/tags?tagKey=${encodeURIComponent(tagKey)}`, { method: 'DELETE' })
      setTags(prev => prev.filter(t => t.tagKey !== tagKey))
    } else {
      const res = await fetch(`/api/clientes/${customer.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagKey }),
      })
      if (res.ok) {
        const json = await res.json()
        setTags(prev => [...prev, json.data as CustomerTag])
      }
    }
  }

  async function addCustomTag() {
    if (!customTagInput.trim()) return
    const label = customTagInput.trim()
    const key = 'custom_' + label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const res = await fetch(`/api/clientes/${customer.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagKey: key }),
    })
    if (res.ok) {
      const json = await res.json()
      setTags(prev => [...prev, json.data as CustomerTag])
    }
    setCustomTagInput('')
  }

  async function saveNote() {
    if (!note.trim()) return
    setSavingNote(true)
    const res = await fetch(`/api/clientes/${customer.id}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'nota', detalles: note.trim() }),
    })
    setSavingNote(false)
    setNote('')
    if (res.ok) {
      const json = await res.json()
      if (json.data) setHistory(prev => [json.data as CustomerHistoryItem, ...prev])
    }
  }

  async function deleteNote(historyId: string) {
    await fetch(`/api/clientes/${customer.id}/history?historyId=${historyId}`, { method: 'DELETE' })
    setHistory(prev => prev.filter(h => h.id !== historyId))
  }

  const nombre = customer.name.split(' ')[0]
  const negocio = brandName

  const CONTACT_MESSAGES: Record<string, string[]> = {
    reactivation: [
      `Hola ${nombre} 👋 hace un tiempo que no sabemos de ti en *${negocio}*. ¡Te extrañamos! ¿En qué podemos ayudarte hoy?`,
      `¡Hola ${nombre}! 😊 Han pasado unos días desde tu última visita y queríamos saludarte. Estamos aquí cuando nos necesites 🙌`,
      `Hola ${nombre}, desde *${negocio}* te enviamos un saludo. Nos encantaría verte de nuevo pronto. ¿Tienes algo pendiente con nosotros?`,
      `¡${nombre}! 👋 Hace rato que no te vemos por acá. En *${negocio}* seguimos con las mismas ganas de atenderte. ¡Cuéntanos cómo estás!`,
      `Hola ${nombre} 😊 ¿Todo bien? Desde *${negocio}* queríamos recordarte que aquí estamos para lo que necesites.`,
      `¡Hola ${nombre}! Notamos que tienes tiempo sin visitarnos. En *${negocio}* tenemos novedades que te pueden interesar. ¿Hablamos?`,
      `Hola ${nombre} 👋 Solo queríamos saludarte desde *${negocio}*. ¿Qué has necesitado últimamente? Quizás podemos ayudarte 😊`,
      `¡${nombre}! Desde *${negocio}* te mandamos un saludo. ¿Cuándo nos visitas de nuevo? ¡Estamos listos para atenderte!`,
      `Hola ${nombre} 😊 En *${negocio}* pensamos en ti hoy. ¡Cuando quieras volver, aquí te esperamos con todo el gusto!`,
      `¡Hola ${nombre}! Ha pasado un tiempo y queríamos saber cómo estás. En *${negocio}* siempre habrá un lugar para ti 🙌`,
    ],
    birthday: [
      `🎂 ¡Feliz cumpleaños ${nombre}! De parte de todo el equipo de *${negocio}*, que tengas un día increíble lleno de alegría. 🎉`,
      `¡Feliz cumpleaños ${nombre}! 🎈 En *${negocio}* celebramos contigo este día especial. ¡Muchos éxitos y alegrías!`,
      `Hola ${nombre} 🎂 Hoy es tu día y en *${negocio}* queremos celebrarlo contigo. ¡Que lo pases increíble!`,
      `¡${nombre}! 🎉 ¡Muchas felicidades en tu cumpleaños! Todo el equipo de *${negocio}* te desea lo mejor.`,
      `Feliz cumpleaños ${nombre} 🎁 Que este año nuevo de vida te traiga muchas bendiciones. Un abrazo de *${negocio}* 💙`,
      `¡Hola ${nombre}! 🎂 Hoy es un día muy especial para ti y queremos ser parte de él. ¡Feliz cumpleaños de parte de *${negocio}*!`,
      `${nombre} 🎈 ¡Hoy es tu día! Desde *${negocio}* te enviamos todo el cariño del mundo. ¡Que la pases genial!`,
      `¡Muchas felicidades ${nombre}! 🎉 En *${negocio}* estamos felices de celebrar este día contigo. ¡Hasta pronto!`,
      `Hola ${nombre} 🎂 Solo queríamos recordarte que en *${negocio}* te apreciamos mucho. ¡Feliz cumpleaños!`,
      `¡${nombre}! Un día especial merece un saludo especial 🎁 Todo el equipo de *${negocio}* te desea un feliz cumpleaños 🎉`,
    ],
    promo: [
      `¡Hola ${nombre}! 🎁 Tenemos una promoción especial en *${negocio}* que creemos te va a encantar. ¿Te cuento más?`,
      `Hola ${nombre} 😊 Esta semana en *${negocio}* tenemos algo especial para clientes como tú. ¡Escríbenos para conocer los detalles!`,
      `¡${nombre}! 🔥 Tenemos novedades en *${negocio}* que no te puedes perder. ¿Cuándo puedes visitarnos?`,
      `Hola ${nombre} 🎉 Solo para avisarte que en *${negocio}* hay promociones especiales esta semana. ¡No te las pierdas!`,
      `¡Hola ${nombre}! En *${negocio}* tenemos algo pensado justo para ti. ¿Tienes un momento para que te cuente?`,
      `${nombre} 👋 ¡Buenas noticias desde *${negocio}*! Hay una oferta especial que podría interesarte. ¿Quieres saber más?`,
      `¡Hola ${nombre}! 🛍️ Esta semana en *${negocio}* celebramos con precios y novedades especiales. ¡Ven a visitarnos!`,
      `Hola ${nombre} 😊 Pensamos en ti cuando vimos esta promoción de *${negocio}*. ¿Te la cuento?`,
      `¡${nombre}! 🎁 Exclusivo para clientes frecuentes como tú: tenemos algo especial en *${negocio}* esta semana.`,
      `Hola ${nombre} 👋 En *${negocio}* queremos premiarte con una oferta especial. ¡Escríbenos y te damos los detalles!`,
    ],
    thanks: [
      `Hola ${nombre} 🙏 Gracias por tu visita a *${negocio}*. Fue un placer atenderte. ¡Esperamos verte pronto!`,
      `¡${nombre}! Muchas gracias por confiar en *${negocio}*. Tu preferencia nos motiva a dar lo mejor 💙`,
      `Hola ${nombre} 😊 Queremos agradecerte por elegirnos. En *${negocio}* siempre daremos lo mejor para ti.`,
      `¡Gracias ${nombre}! 🙏 Tu visita a *${negocio}* hizo nuestro día. ¡Vuelve pronto, aquí te esperamos!`,
      `${nombre}, desde *${negocio}* queremos darte las gracias por tu preferencia. Fue un gusto atenderte 💙`,
      `Hola ${nombre} 👋 Solo queríamos decirte gracias. Clientes como tú hacen que *${negocio}* valga la pena cada día 🙌`,
      `¡${nombre}! Gracias por visitarnos. En *${negocio}* nos esforzamos por darte siempre la mejor experiencia 😊`,
      `Hola ${nombre} 🙏 Gracias por tu confianza en *${negocio}*. ¡Cualquier cosa que necesites, aquí estamos!`,
      `¡Gracias ${nombre}! Tu visita a *${negocio}* fue especial para nosotros. ¡Hasta la próxima! 💙`,
      `${nombre} 😊 Queremos agradecerte por ser parte de *${negocio}*. ¡Tu apoyo significa mucho para todo el equipo!`,
    ],
    appointment_reminder: [
      `Hola ${nombre} ⏰ Te recordamos tu cita en *${negocio}*. Si necesitas reagendar o tienes alguna duda, escríbenos.`,
      `¡${nombre}! 📅 Solo un recordatorio de tu próxima cita en *${negocio}*. ¡Te esperamos con todo listo!`,
      `Hola ${nombre} 😊 Queríamos recordarte que tienes una cita pendiente en *${negocio}*. ¿Confirmamos?`,
      `¡Hola ${nombre}! ⏰ Este es un recordatorio amistoso de tu cita en *${negocio}*. Si no puedes, avísanos con tiempo.`,
      `${nombre} 📅 No olvides tu cita en *${negocio}*. ¡Te esperamos! Si necesitas cambiar el horario, con gusto te ayudamos.`,
      `Hola ${nombre} 👋 Tu cita en *${negocio}* se acerca. ¡Recuerda venir a la hora acordada! ¿Tienes alguna pregunta?`,
      `¡${nombre}! Solo queríamos recordarte tu próxima visita a *${negocio}*. ¡Nos vemos pronto!`,
      `Hola ${nombre} ⏰ Recordatorio de tu cita en *${negocio}*. Si hay algún cambio en tu agenda, cuéntanos y buscamos otra fecha.`,
      `¡Hola ${nombre}! 📅 Te esperamos en *${negocio}* en la fecha acordada. ¡Todo estará listo para ti!`,
      `${nombre} 😊 Un pequeño recordatorio: tienes una cita en *${negocio}*. ¡No te nos vayas a perder! 🙌`,
    ],
    quote_followup: [
      `Hola ${nombre} 👋 Hace unos días te enviamos una cotización desde *${negocio}*. ¿Pudiste revisarla? ¿Tienes alguna pregunta?`,
      `¡${nombre}! Solo queríamos hacer seguimiento a la cotización de *${negocio}*. ¿La revisaste? Estamos aquí para aclarar dudas.`,
      `Hola ${nombre} 📋 ¿Cómo vas con la cotización que te enviamos de *${negocio}*? ¿Podemos ayudarte con algo más?`,
      `¡Hola ${nombre}! Hace unos días compartimos una propuesta desde *${negocio}*. ¿Te sirvió? ¿Seguimos adelante?`,
      `${nombre} 😊 Solo un mensaje para saber si pudiste ver la cotización de *${negocio}*. Si tienes dudas, con gusto te explicamos.`,
      `Hola ${nombre} 📋 Desde *${negocio}* hacemos seguimiento a nuestra propuesta. ¿Qué tal te pareció? ¿Ajustamos algo?`,
      `¡${nombre}! ¿Revisaste la cotización de *${negocio}*? Si quieres podemos coordinar una llamada para resolverlo. 😊`,
      `Hola ${nombre} 👋 Quedamos pendientes de tu decisión sobre la propuesta de *${negocio}*. ¿Cómo podemos ayudarte?`,
      `¡Hola ${nombre}! 📋 Desde *${negocio}* queremos saber si nuestra cotización se ajusta a lo que necesitas. ¿Hablamos?`,
      `${nombre} 😊 ¿Alguna novedad con la cotización de *${negocio}*? ¡Estamos listos para avanzar cuando tú quieras!`,
    ],
  }

  function getContactMessage(): string {
    const pool = CONTACT_MESSAGES[contactMsgType] ?? CONTACT_MESSAGES.reactivation
    return pool[contactMsgIndex % pool.length]
  }

  function nextContactMessage() {
    const pool = CONTACT_MESSAGES[contactMsgType] ?? CONTACT_MESSAGES.reactivation
    setContactMsgIndex(i => (i + 1) % pool.length)
  }

  async function copyContactMessage() {
    try {
      await navigator.clipboard.writeText(getContactMessage())
      setContactMsgCopied(true)
      setTimeout(() => setContactMsgCopied(false), 2000)
    } catch {}
  }

  function toggleInterest(val: string) {
    const curr = form.intereses ?? []
    setForm(f => ({
      ...f,
      intereses: curr.includes(val) ? curr.filter(i => i !== val) : [...curr, val],
    }))
  }

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'perfil', label: 'Perfil', icon: FileText },
    { key: 'etiquetas', label: 'Etiquetas', icon: Tag },
    { key: 'historial', label: 'Historial', icon: Clock },
    { key: 'notas', label: 'Notas', icon: MessageSquare },
    { key: 'mensaje', label: 'Contacto', icon: MessageCircle },
  ]

  const vtag = visitTag(customer.totalVisits)
  const days = daysSince(customer.lastVisitAt)

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-sm font-bold text-indigo-700">
            {initials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${vtag.color}`}>{vtag.label}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {(customer.phone || customer.celular) && (
              <button
                onClick={openReactivationWa}
                title="Enviar mensaje de reactivación por WhatsApp"
                className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
              >
                <MessageCircle size={15} />
              </button>
            )}
            {tab === 'perfil' && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Edit2 size={15} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 text-center bg-gray-50">
          <div className="py-3 px-2">
            <p className="text-lg font-bold text-gray-900">{customer.totalVisits}</p>
            <p className="text-[10px] text-gray-400">visitas</p>
          </div>
          <div className="py-3 px-2">
            <p className="text-sm font-semibold text-gray-900">
              {days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `${days}d`}
            </p>
            <p className="text-[10px] text-gray-400">última visita</p>
          </div>
          <div className="py-3 px-2">
            <p className="text-sm font-semibold text-gray-900">
              {fmt(customer.firstVisitAt, { month: 'short', year: '2-digit' })}
            </p>
            <p className="text-[10px] text-gray-400">desde</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setEditing(false) }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold flex-1 justify-center transition-colors border-b-2 ${
                tab === key
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Perfil ── */}
          {tab === 'perfil' && (
            <div className="p-5 space-y-5">
              {editing ? (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'name', label: 'Nombre completo', type: 'text', required: true },
                      { key: 'phone', label: 'Teléfono', type: 'tel' },
                      { key: 'celular', label: 'Celular (WhatsApp)', type: 'tel' },
                      { key: 'email', label: 'Correo electrónico', type: 'email' },
                      { key: 'documentId', label: 'Documento de identidad', type: 'text' },
                    ].map(({ key, label, type, required }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>
                        <input
                          type={type}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          value={(form as any)[key] ?? ''}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      </div>
                    ))}

                    {/* Canal de contacto */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Canal preferido</label>
                      <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                        value={form.canalContacto ?? ''}
                        onChange={e => setForm(f => ({ ...f, canalContacto: e.target.value }))}
                      >
                        <option value="">Seleccionar...</option>
                        {CANAL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Cumpleaños */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cumpleaños</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                        value={form.cumpleanos ?? ''}
                        onChange={e => setForm(f => ({ ...f, cumpleanos: e.target.value }))}
                      />
                    </div>

                    {/* Intereses */}
                    {(() => {
                      const predefined = getInteresOptions(businessType)
                      const custom = (form.intereses ?? []).filter(i => !predefined.includes(i))
                      return (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Servicios de interés</label>
                          <div className="flex flex-wrap gap-1.5">
                            {predefined.map(opt => {
                              const active = (form.intereses ?? []).includes(opt)
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleInterest(opt)}
                                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                    active
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                            {custom.map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleInterest(opt)}
                                className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-600 text-white transition-colors"
                              >
                                {opt} ✕
                              </button>
                            ))}
                            <div className="flex gap-1.5 w-full mt-1">
                              <input
                                type="text"
                                placeholder="Agregar interés personalizado..."
                                className="flex-1 text-xs px-2.5 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                value={customTagInput}
                                onChange={e => setCustomTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const val = customTagInput.trim()
                                    if (val && !(form.intereses ?? []).includes(val)) {
                                      setForm(f => ({ ...f, intereses: [...(f.intereses ?? []), val] }))
                                    }
                                    setCustomTagInput('')
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = customTagInput.trim()
                                  if (val && !(form.intereses ?? []).includes(val)) {
                                    setForm(f => ({ ...f, intereses: [...(f.intereses ?? []), val] }))
                                  }
                                  setCustomTagInput('')
                                }}
                                className="text-xs px-3 py-1.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                              >
                                + Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.name.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setForm({ ...customer }) }}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Contact info */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contacto</p>
                    <div className="space-y-2.5">
                      <InfoRow icon={Phone} label="Teléfono" value={customer.phone} />
                      <InfoRow icon={Smartphone} label="Celular / WhatsApp" value={customer.celular} />
                      <InfoRow icon={Mail} label="Correo" value={customer.email} />
                      <InfoRow icon={FileText} label="Documento" value={customer.documentId} />
                      <InfoRow icon={Wifi} label="Canal preferido" value={customer.canalContacto} />
                      {customer.cumpleanos && (
                        <InfoRow icon={Cake} label="Cumpleaños" value={fmt(customer.cumpleanos, { day: 'numeric', month: 'long' })} />
                      )}
                    </div>
                  </div>

                  {/* Intereses */}
                  {(customer.intereses ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Servicios de interés</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(customer.intereses ?? []).map(i => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{i}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Establishments */}
                  {customer.establishmentIds.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Sucursales visitadas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {customer.establishmentIds.map(eid => (
                          <span key={eid} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                            <Building2 size={9} />{estMap[eid] ?? '?'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Actividad</p>
                    <div className="space-y-2">
                      <InfoRow icon={Calendar} label="Primera visita" value={fmt(customer.firstVisitAt)} />
                      <InfoRow icon={Calendar} label="Última visita" value={fmt(customer.lastVisitAt)} />
                      {customer.ultimaCompra && (
                        <InfoRow icon={Star} label="Última compra" value={fmt(customer.ultimaCompra)} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Etiquetas ── */}
          {tab === 'etiquetas' && (
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Asigna etiquetas a este cliente</p>
              {loadingTabs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  {PREDEFINED_TAGS.map(({ key, label, color }) => {
                    const active = tags.some(t => t.tagKey === key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleTag(key)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          active
                            ? 'border-indigo-200 bg-indigo-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>{label}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          active ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                        }`}>
                          {active && <Check size={10} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                  {/* Custom tags already added */}
                  {tags.filter(t => t.tagKey.startsWith('custom_')).map(t => (
                    <div key={t.id} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">
                        {t.tagKey.replace('custom_', '')}
                      </span>
                      <button onClick={() => toggleTag(t.tagKey)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={e => setCustomTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                      placeholder="Nueva etiqueta..."
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      maxLength={30}
                    />
                    <button onClick={addCustomTag} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">+</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Historial ── */}
          {tab === 'historial' && (
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Actividad reciente</p>
              {loadingTabs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-indigo-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin historial registrado aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-gray-100">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.tipo === 'visita' || item.tipo === 'cola' ? 'bg-green-100 text-green-600'
                        : item.tipo === 'compra' || item.tipo === 'venta' ? 'bg-emerald-100 text-emerald-600'
                        : item.tipo === 'cita' ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.tipo === 'visita' || item.tipo === 'cola' ? <UserCheck size={13} />
                          : item.tipo === 'compra' || item.tipo === 'venta' ? <ShoppingCart size={13} />
                          : item.tipo === 'cita' ? <CalendarCheck size={13} />
                          : <MessageSquare size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 capitalize">{{
                          visita: 'Visita', cola: 'Cola de espera', compra: 'Compra',
                          venta: 'Venta', cita: 'Cita', nota: 'Nota'
                        }[item.tipo] ?? item.tipo}</p>
                        {item.detalles && <p className="text-xs text-gray-500 mt-0.5">{item.detalles}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">{fmt(item.fecha)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Notas ── */}
          {tab === 'notas' && (
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Agregar nota rápida</p>
              <div className="flex flex-col gap-2 mb-5">
                <textarea
                  rows={3}
                  placeholder="Ej: Cliente prefiere citas los martes por la tarde..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none resize-none"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <button
                  onClick={saveNote}
                  disabled={!note.trim() || savingNote}
                  className="self-end flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Guardar nota
                </button>
              </div>

              {loadingTabs ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={18} className="animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  {history.filter(h => h.tipo === 'nota').map(item => (
                    <div key={item.id} className="p-3 rounded-xl bg-amber-50 border border-amber-100 group relative">
                      <button
                        onClick={() => deleteNote(item.id)}
                        className="absolute top-2 right-2 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar nota"
                      >
                        <X size={12} />
                      </button>
                      <p className="text-sm text-gray-700">{item.detalles}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{fmt(item.fecha, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                  {history.filter(h => h.tipo === 'nota').length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Sin notas registradas</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Contacto ── */}
          {tab === 'mensaje' && (
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Tipo de mensaje</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'reactivation',        label: 'Invitar a volver',       emoji: '👋' },
                    { key: 'quote_followup',       label: 'Seguimiento cotización', emoji: '📋' },
                    { key: 'birthday',             label: 'Cumpleaños',             emoji: '🎂' },
                    { key: 'promo',                label: 'Promoción',              emoji: '🎁' },
                    { key: 'thanks',               label: 'Agradecimiento',         emoji: '🙏' },
                    { key: 'appointment_reminder', label: 'Recordatorio cita',      emoji: '📅' },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => { setContactMsgType(t.key); setContactMsgIndex(0) }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        contactMsgType === t.key
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {daysSince(customer.lastVisitAt) > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <Clock size={12} />
                  {nombre} lleva {daysSince(customer.lastVisitAt)} días sin visitar
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">
                    Mensaje {contactMsgIndex + 1} de {(CONTACT_MESSAGES[contactMsgType] ?? CONTACT_MESSAGES.reactivation).length}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={nextContactMessage}
                      title="Siguiente variante"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <RefreshCw size={12} />
                    </button>
                    <button
                      onClick={copyContactMessage}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        contactMsgCopied
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                    >
                      {contactMsgCopied ? <Check size={11} /> : <Copy size={11} />}
                      {contactMsgCopied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{getContactMessage()}</p>
                </div>
                {(customer.phone || customer.celular) && (
                  <div className="px-4 pb-3">
                    <a
                      href={buildWaMessage(getContactMessage(), {}, customer.phone || customer.celular || '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Send size={13} />
                      Abrir en WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={12} className="text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value ?? '—'}</p>
      </div>
    </div>
  )
}

// ─── CreateModal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (c: Customer) => void
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', documentId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone || null,
          email: form.email || null,
          documentId: form.documentId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Error al crear cliente'); setSaving(false); return }
      if (json.data) {
        onCreated({
          ...json.data,
          firstVisitAt: json.data.createdAt ?? new Date().toISOString(),
          lastVisitAt: json.data.createdAt ?? new Date().toISOString(),
          totalVisits: 0,
          establishmentIds: [],
          celular: null,
          canalContacto: null,
          intereses: null,
          cumpleanos: null,
          ultimaCompra: null,
        } as Customer)
      }
      onClose()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Nuevo cliente</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { key: 'name', label: 'Nombre *', type: 'text' },
            { key: 'phone', label: 'Teléfono', type: 'tel' },
            { key: 'email', label: 'Correo', type: 'email' },
            { key: 'documentId', label: 'Documento', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Creando...' : 'Crear cliente'}
            </button>
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function ClientesPanel({
  brandId,
  businessType = 'otros',
  brandName = 'Tu negocio',
  initialCustomers,
  establishments,
  waTemplates = [],
}: Props) {
  const bv = BIZ_VOCAB[businessType] ?? BIZ_VOCAB.otros
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const [filterEst, setFilterEst] = useState('')
  const [filterType, setFilterType] = useState<'' | 'new' | 'occasional' | 'frequent' | 'loyal'>('')
  const [sortField, setSortField] = useState<'lastVisitAt' | 'totalVisits' | 'name'>('lastVisitAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])

  const filtered = useMemo(() => {
    let list = [...customers]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.documentId?.includes(q)
      )
    }
    if (filterEst) list = list.filter(c => c.establishmentIds.includes(filterEst))
    if (filterType) {
      list = list.filter(c => {
        const v = c.totalVisits
        if (filterType === 'new') return v === 1
        if (filterType === 'occasional') return v >= 2 && v <= 3
        if (filterType === 'frequent') return v >= 4 && v <= 9
        if (filterType === 'loyal') return v >= 10
        return true
      })
    }
    list.sort((a, b) => {
      let av: any = a[sortField]
      let bv: any = b[sortField]
      if (sortField === 'lastVisitAt') { av = new Date(av).getTime(); bv = new Date(bv).getTime() }
      if (sortField === 'name') { av = av.toLowerCase(); bv = bv.toLowerCase() }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return list
  }, [customers, search, filterEst, filterType, sortField, sortDir])

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const total = customers.length
  const newOnes = customers.filter(c => c.totalVisits === 1).length
  const returning = customers.filter(c => c.totalVisits >= 2).length
  const loyal = customers.filter(c => c.totalVisits >= 10).length
  const avgVisits = total > 0 ? (customers.reduce((s, c) => s + c.totalVisits, 0) / total).toFixed(1) : '0'

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="opacity-30" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{bv.clients.charAt(0).toUpperCase() + bv.clients.slice(1)}</h1>
          <p className="text-gray-500 text-sm mt-1">Perfil e historial de cada {bv.client}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-indigo-200 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <Upload size={15} /> Carga masiva
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> {bv.newClient}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', sub: 'clientes', value: total, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Nuevos', sub: '1 sola visita', value: newOnes, icon: UserPlus, color: 'bg-blue-100 text-blue-600' },
          { label: 'Recurrentes', sub: '2 o más visitas', value: returning, icon: RotateCcw, color: 'bg-green-100 text-green-600' },
          { label: 'Fieles', sub: '10+ visitas', value: loyal, icon: Star, color: 'bg-purple-100 text-purple-600' },
          { label: 'Promedio', sub: 'visitas por cliente', value: avgVisits, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
        ].map(({ label, sub, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={13} />
              </div>
              <p className="text-xs font-semibold text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Buscar por nombre, teléfono, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {establishments.length > 1 && (
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
            value={filterEst}
            onChange={e => setFilterEst(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
        >
          <option value="">Todos los tipos</option>
          <option value="new">Nuevos (1 visita)</option>
          <option value="occasional">Ocasionales (2–3)</option>
          <option value="frequent">Frecuentes (4–9)</option>
          <option value="loyal">Fieles (10+)</option>
        </select>
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center px-6">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCheck size={28} className="text-indigo-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Aún no hay clientes registrados</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Los clientes se registran automáticamente cada vez que se atiende un turno en la cola de espera.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('name')}>
                      Cliente <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">Contacto</th>
                  <th className="px-4 py-2.5 text-left hidden lg:table-cell">Sucursales</th>
                  <th className="px-4 py-2.5 text-center">
                    <button className="flex items-center gap-1 hover:text-gray-700 mx-auto" onClick={() => toggleSort('totalVisits')}>
                      Visitas <SortIcon field="totalVisits" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('lastVisitAt')}>
                      Última visita <SortIcon field="lastVisitAt" />
                    </button>
                  </th>
                  <th className="px-3 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                      Sin resultados para los filtros aplicados
                    </td>
                  </tr>
                ) : filtered.map(customer => {
                  const tag = visitTag(customer.totalVisits)
                  const days = daysSince(customer.lastVisitAt)
                  const isExpanded = expandedId === customer.id
                  return (
                    <>
                      <tr
                        key={customer.id}
                        onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                        className={`cursor-pointer group transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-indigo-50/40'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-700">
                              {initials(customer.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tag.color}`}>{tag.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone size={10} className="shrink-0 text-gray-400" /> {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail size={10} className="shrink-0 text-gray-400" />
                                <span className="truncate max-w-[160px]">{customer.email}</span>
                              </div>
                            )}
                            {!customer.phone && !customer.email && <span className="text-xs text-gray-300">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {customer.establishmentIds.slice(0, 2).map(eid => (
                              <span key={eid} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                {estMap[eid] ?? '?'}
                              </span>
                            ))}
                            {customer.establishmentIds.length > 2 && (
                              <span className="text-[10px] text-gray-400">+{customer.establishmentIds.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className="text-sm font-bold text-gray-900">{customer.totalVisits}</p>
                          <p className="text-[10px] text-gray-400">
                            desde {new Date(customer.firstVisitAt).toLocaleDateString('es', { month: 'short', year: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">
                            {days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days}d`}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(customer.lastVisitAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <ChevronDown size={13} className={`transition-transform ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-gray-300 group-hover:text-indigo-400'}`} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <CustomerExpandedRow
                          key={`${customer.id}-expand`}
                          customer={customer}
                          establishments={establishments}
                          brandName={brandName}
                          colSpan={6}
                          onUpdate={updated => {
                            setCustomers(cs => cs.map(c => c.id === updated.id ? updated : c))
                          }}
                        />
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            {filtered.length} de {total} clientes · Haz clic en una fila para edición rápida
          </div>
        </div>
      )}

      {/* Bulk upload modal */}
      {showBulkUpload && (
        <BulkUploadModal
          type="customers"
          brandId={brandId}
          open={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          onComplete={() => { setShowBulkUpload(false); window.location.reload() }}
        />
      )}

      {/* Create modal */}
      {createModal && (
        <CreateModal
          onClose={() => setCreateModal(false)}
          onCreated={newCustomer => {
            setCustomers(cs => [newCustomer, ...cs])
            setCreateModal(false)
          }}
        />
      )}

      {/* SlideOver */}
      {selectedCustomer && (
        <CustomerSlideOver
          customer={selectedCustomer}
          establishments={establishments}
          businessType={businessType}
          waTemplates={waTemplates}
          brandName={brandName}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={updated => {
            setCustomers(cs => cs.map(c => c.id === updated.id ? updated : c))
            setSelectedCustomer(updated)
          }}
        />
      )}
    </div>
  )
}
