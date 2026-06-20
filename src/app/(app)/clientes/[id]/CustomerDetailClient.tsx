'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, Mail, Building2, Calendar, Star,
  Edit2, Check, X, Save, Loader2, Tag, Clock,
  MessageSquare, FileText, ChevronRight,
  Cake, Wifi, Smartphone, ShoppingCart, CalendarCheck,
  Sparkles, Copy, RefreshCw, Send, MessageCircle,
  UserCheck, Plus,
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  documentId: string | null
  firstVisitAt: string
  lastVisitAt: string
  totalVisits: number
  establishmentIds: string[]
  celular?: string | null
  canalContacto?: string | null
  ultimaCompra?: string | null
  intereses?: string[] | null
  cumpleanos?: string | null
}

interface CustomerTag {
  id: string
  customerId: string
  tagKey: string
  tagLabel?: string | null
}

interface CustomerHistoryItem {
  id: string
  customerId: string
  tipo: string
  fecha: string
  detalles: string | null
}

interface TreatmentRecord {
  id: string
  date: string
  serviceName: string
  notes: string | null
  price: number | null
  advisor?: { full_name: string } | null
}

interface Establishment { id: string; name: string }

const PREDEFINED_TAGS = [
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
  belleza: ['Corte de cabello', 'Tinte / Color', 'Manicure', 'Pedicure', 'Tratamiento capilar', 'Depilación', 'Masajes', 'Faciales', 'Uñas acrílicas / semipermanentes', 'Alisado / Keratina'],
  restaurante: ['Desayunos', 'Almuerzos ejecutivos', 'Comida rápida', 'Postres', 'Bebidas / Jugos', 'Domicilios', 'Eventos / Catering', 'Menú vegetariano', 'Comida saludable', 'Café de especialidad'],
  ferreteria: ['Electricidad', 'Plomería', 'Pintura', 'Herramientas', 'Cerrajería', 'Soldadura', 'Tornillería', 'Materiales de construcción', 'Reparación de equipos', 'Mantenimiento preventivo'],
  tienda: ['Ropa mujer', 'Ropa hombre', 'Accesorios', 'Calzado', 'Productos para mascotas', 'Papelería', 'Tecnología', 'Hogar y decoración', 'Productos de belleza', 'Regalos'],
  servicios: ['Consultoría', 'Asesoría legal', 'Contabilidad', 'Diseño gráfico', 'Desarrollo web', 'Marketing digital', 'Capacitación', 'Salud / Terapia', 'Fotografía', 'Transporte / Logística'],
  otros: ['Producto principal', 'Servicio básico', 'Asesoría', 'Mantenimiento', 'Instalación', 'Reparación', 'Consulta', 'Paquete premium', 'Suscripción mensual', 'Servicio a domicilio'],
}

function getInteresOptions(businessType: string): string[] {
  return INTERES_BY_VERTICAL[businessType] ?? INTERES_BY_VERTICAL.otros
}

function visitTag(totalVisits: number) {
  if (totalVisits === 1) return { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' }
  if (totalVisits <= 3) return { label: 'Ocasional', color: 'bg-amber-100 text-amber-700' }
  if (totalVisits <= 9) return { label: 'Frecuente', color: 'bg-green-100 text-green-700' }
  return { label: 'Fiel', color: 'bg-purple-100 text-purple-700' }
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function fmt(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
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

type Tab = 'perfil' | 'etiquetas' | 'historial' | 'notas' | 'mensaje' | 'tratamientos'

export function CustomerDetailClient({
  customer: initialCustomer,
  establishments,
  businessType = 'otros',
  waTemplates = [],
  brandName = 'Tu negocio',
}: {
  customer: Customer
  establishments: Establishment[]
  businessType?: string
  waTemplates?: { category: string; body: string }[]
  brandName?: string
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState(initialCustomer)
  const [tab, setTab] = useState<Tab>('perfil')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...initialCustomer })
  const [saving, setSaving] = useState(false)
  const [tags, setTags] = useState<CustomerTag[]>([])
  const [history, setHistory] = useState<CustomerHistoryItem[]>([])
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [loadingTabs, setLoadingTabs] = useState(false)
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([])
  const [loadingTreatments, setLoadingTreatments] = useState(false)
  const [customTagInput, setCustomTagInput] = useState('')
  const [contactMsgType, setContactMsgType] = useState('reactivation')
  const [contactMsgIndex, setContactMsgIndex] = useState(0)
  const [contactMsgCopied, setContactMsgCopied] = useState(false)

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])

  const loadTabData = useCallback(async () => {
    if (tab === 'etiquetas') {
      setLoadingTabs(true)
      const res = await fetch(`/api/clientes/${customer.id}/tags`)
      if (res.ok) setTags(await res.json())
      setLoadingTabs(false)
    }

    if (tab === 'historial' || tab === 'notas') {
      setLoadingTabs(true)
      const [histRes, salesRes] = await Promise.all([
        fetch(`/api/clientes/${customer.id}/history`),
        fetch(`/api/ventas?customerId=${customer.id}&type=sale&status=completed&limit=20`),
      ])

      const manualHistory: CustomerHistoryItem[] = histRes.ok ? await histRes.json() : []
      const salesData = salesRes.ok ? await salesRes.json() : { data: [] }

      const salesItems: CustomerHistoryItem[] = (salesData.data ?? []).map((s: any) => ({
        id: `sale_${s.id}`,
        customerId: customer.id,
        tipo: 'venta',
        fecha: s.createdAt,
        detalles: [
          `Total: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(s.total)}`,
          s.establishmentName ? `Sucursal: ${s.establishmentName}` : null,
        ].filter(Boolean).join(' · '),
      }))

      const combined = [...manualHistory, ...salesItems]
      combined.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      setHistory(combined)
      setLoadingTabs(false)
    }

    if (tab === 'tratamientos') {
      setLoadingTreatments(true)
      const res = await fetch(`/api/clientes/${customer.id}/treatments`)
      if (res.ok) {
        const data = await res.json()
        setTreatments(data.map((r: any) => ({
          id: r.id,
          date: r.date,
          serviceName: r.serviceName,
          notes: r.notes,
          price: r.price ? parseFloat(r.price) : null,
          advisor: r.advisor,
        })))
      }
      setLoadingTreatments(false)
    }
  }, [tab, customer.id])

  useEffect(() => { loadTabData() }, [loadTabData])

  async function handleSave() {
    setSaving(true)
    const patch: Record<string, unknown> = {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      documentId: form.documentId || null,
    }
    if ('celular' in customer) patch.celular = form.celular || null
    if ('canalContacto' in customer) patch.canalContacto = form.canalContacto || null
    if ('cumpleanos' in customer) patch.cumpleanos = form.cumpleanos || null
    if ('intereses' in customer) patch.intereses = form.intereses ?? []

    const res = await fetch(`/api/clientes/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSaving(false)
    setEditing(false)
    if (res.ok) {
      const { data } = await res.json()
      setCustomer(prev => ({ ...prev, ...data }))
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
        const data = await res.json()
        setTags(prev => [...prev, data])
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
      body: JSON.stringify({ tagKey: key, tagLabel: label }),
    })
    if (res.ok) {
      const data = await res.json()
      setTags(prev => [...prev, data])
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
      const data = await res.json()
      setHistory(prev => [data, ...prev])
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

  function getContactMessage() {
    const pool = CONTACT_MESSAGES[contactMsgType] ?? CONTACT_MESSAGES.reactivation
    return pool[contactMsgIndex % pool.length]
  }
  function nextContactMessage() {
    const pool = CONTACT_MESSAGES[contactMsgType] ?? CONTACT_MESSAGES.reactivation
    setContactMsgIndex(i => (i + 1) % pool.length)
  }
  async function copyContactMessage() {
    try { await navigator.clipboard.writeText(getContactMessage()); setContactMsgCopied(true); setTimeout(() => setContactMsgCopied(false), 2000) } catch {}
  }

  const vtag = visitTag(customer.totalVisits)
  const days = daysSince(customer.lastVisitAt)
  const phone = customer.celular || customer.phone

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'perfil', label: 'Perfil', icon: FileText },
    { key: 'etiquetas', label: 'Etiquetas', icon: Tag },
    { key: 'historial', label: 'Historial', icon: Clock },
    ...(businessType === 'belleza' ? [{ key: 'tratamientos' as Tab, label: 'Tratamientos', icon: Sparkles }] : []),
    { key: 'notas', label: 'Notas', icon: MessageSquare },
    { key: 'mensaje', label: 'Contacto', icon: MessageCircle },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-4 transition-colors"
      >
        <ArrowLeft size={15} /> Volver a clientes
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-sm font-bold text-indigo-700">
            {initials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg">{customer.name}</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${vtag.color}`}>{vtag.label}</span>
          </div>
          {phone && (
            <a
              href={`https://wa.me/${phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          )}
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 text-center bg-gray-50">
          <div className="py-3 px-2">
            <p className="text-xl font-bold text-gray-900">{customer.totalVisits}</p>
            <p className="text-[10px] text-gray-400">visitas</p>
          </div>
          <div className="py-3 px-2">
            <p className="text-sm font-semibold text-gray-900">{days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `${days}d`}</p>
            <p className="text-[10px] text-gray-400">última visita</p>
          </div>
          <div className="py-3 px-2">
            <p className="text-sm font-semibold text-gray-900">{fmt(customer.firstVisitAt, { month: 'short', year: '2-digit' })}</p>
            <p className="text-[10px] text-gray-400">desde</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setEditing(false) }}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                tab === key ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── Perfil ── */}
          {tab === 'perfil' && (
            <div className="space-y-5">
              {editing ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'name', label: 'Nombre completo', type: 'text', required: true },
                      { key: 'phone', label: 'Teléfono', type: 'tel' },
                      { key: 'email', label: 'Correo electrónico', type: 'email' },
                      { key: 'documentId', label: 'Documento', type: 'text' },
                      ...('celular' in customer ? [{ key: 'celular', label: 'Celular (WhatsApp)', type: 'tel' }] : []),
                    ].map(({ key, label, type, required }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>
                        <input type={type}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          value={(form as any)[key] ?? ''}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      </div>
                    ))}

                    {'canalContacto' in customer && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Canal preferido</label>
                        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          value={form.canalContacto ?? ''}
                          onChange={e => setForm(f => ({ ...f, canalContacto: e.target.value }))}>
                          <option value="">Seleccionar...</option>
                          {CANAL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}

                    {'cumpleanos' in customer && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cumpleaños</label>
                        <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          value={form.cumpleanos ?? ''}
                          onChange={e => setForm(f => ({ ...f, cumpleanos: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>

                  {'intereses' in customer && (() => {
                    const predefined = getInteresOptions(businessType)
                    const custom = (form.intereses ?? []).filter(i => !predefined.includes(i))
                    return (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Servicios de interés</label>
                        <div className="flex flex-wrap gap-1.5">
                          {predefined.map(opt => {
                            const active = (form.intereses ?? []).includes(opt)
                            return (
                              <button key={opt} type="button"
                                onClick={() => { const curr = form.intereses ?? []; setForm(f => ({ ...f, intereses: curr.includes(opt) ? curr.filter(i => i !== opt) : [...curr, opt] })) }}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {opt}
                              </button>
                            )
                          })}
                          {custom.map(opt => (
                            <button key={opt} type="button"
                              onClick={() => { const curr = form.intereses ?? []; setForm(f => ({ ...f, intereses: curr.filter(i => i !== opt) })) }}
                              className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-600 text-white">{opt} ✕</button>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving || !form.name.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button onClick={() => { setEditing(false); setForm({ ...customer }) }}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contacto</p>
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      <Edit2 size={11} /> Editar
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    <InfoRow icon={Phone} label="Teléfono" value={customer.phone} />
                    {'celular' in customer && <InfoRow icon={Smartphone} label="Celular / WhatsApp" value={customer.celular} />}
                    <InfoRow icon={Mail} label="Correo" value={customer.email} />
                    <InfoRow icon={FileText} label="Documento" value={customer.documentId} />
                    {'canalContacto' in customer && <InfoRow icon={Wifi} label="Canal preferido" value={customer.canalContacto} />}
                    {'cumpleanos' in customer && <InfoRow icon={Cake} label="Cumpleaños" value={customer.cumpleanos ? fmt(customer.cumpleanos, { day: 'numeric', month: 'long' }) : null} />}
                  </div>

                  {'intereses' in customer && (customer.intereses ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Servicios de interés</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(customer.intereses ?? []).map(i => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{i}</span>
                        ))}
                      </div>
                    </div>
                  )}

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

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Actividad</p>
                    <div className="space-y-2">
                      <InfoRow icon={Calendar} label="Primera visita" value={fmt(customer.firstVisitAt)} />
                      <InfoRow icon={Calendar} label="Última visita" value={fmt(customer.lastVisitAt)} />
                      {'ultimaCompra' in customer && <InfoRow icon={Star} label="Última compra" value={customer.ultimaCompra ? fmt(customer.ultimaCompra) : null} />}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Etiquetas ── */}
          {tab === 'etiquetas' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Asigna etiquetas</p>
              {loadingTabs ? <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-indigo-400" /></div> : (
                <div className="space-y-2">
                  {PREDEFINED_TAGS.map(({ key, label, color }) => {
                    const active = tags.some(t => t.tagKey === key)
                    return (
                      <button key={key} onClick={() => toggleTag(key)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${active ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>{label}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                          {active && <Check size={10} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                  {tags.filter(t => t.tagKey.startsWith('custom_')).map(t => (
                    <div key={t.id} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">{t.tagLabel ?? t.tagKey.replace('custom_', '')}</span>
                      <button onClick={() => toggleTag(t.tagKey)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <input type="text" value={customTagInput} onChange={e => setCustomTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                      placeholder="Nueva etiqueta..." maxLength={30}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button onClick={addCustomTag} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">+</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Historial ── */}
          {tab === 'historial' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Actividad reciente</p>
              {loadingTabs ? <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-indigo-400" /></div>
                : history.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin historial registrado aún</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map(item => (
                      <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-gray-100">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.tipo === 'visita' || item.tipo === 'cola' ? 'bg-green-100 text-green-600' : item.tipo === 'compra' || item.tipo === 'venta' ? 'bg-emerald-100 text-emerald-600' : item.tipo === 'cita' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                          {item.tipo === 'visita' || item.tipo === 'cola' ? <UserCheck size={13} /> : item.tipo === 'compra' || item.tipo === 'venta' ? <ShoppingCart size={13} /> : item.tipo === 'cita' ? <CalendarCheck size={13} /> : <MessageSquare size={13} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 capitalize">{{ visita: 'Visita', cola: 'Cola de espera', compra: 'Compra', venta: 'Venta', cita: 'Cita', nota: 'Nota' }[item.tipo] ?? item.tipo}</p>
                          {item.detalles && <p className="text-xs text-gray-500 mt-0.5">{item.detalles}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">{fmt(item.fecha)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ── Tratamientos ── */}
          {tab === 'tratamientos' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Historial de tratamientos</p>
              {loadingTreatments ? <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-indigo-400" /></div>
                : treatments.length === 0 ? (
                  <div className="text-center py-12 text-gray-400"><Sparkles size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin tratamientos registrados</p></div>
                ) : (
                  <div className="space-y-3">
                    {treatments.map(t => (
                      <div key={t.id} className="p-3 rounded-xl border border-gray-100 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800">{t.serviceName}</p>
                          {t.price != null && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(t.price)}</span>}
                        </div>
                        {t.advisor && <p className="text-xs text-gray-500 mt-0.5">por {t.advisor.full_name}</p>}
                        {t.notes && <p className="text-xs text-gray-500 mt-1 italic">"{t.notes}"</p>}
                        <p className="text-[10px] text-gray-400 mt-1.5">{new Date(t.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ── Notas ── */}
          {tab === 'notas' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Agregar nota rápida</p>
              <div className="flex flex-col gap-2 mb-5">
                <textarea rows={3} placeholder="Ej: Cliente prefiere citas los martes por la tarde..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none resize-none"
                  value={note} onChange={e => setNote(e.target.value)}
                />
                <button onClick={saveNote} disabled={!note.trim() || savingNote}
                  className="self-end flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                  {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Guardar nota
                </button>
              </div>
              {loadingTabs ? <div className="flex items-center justify-center py-6"><Loader2 size={18} className="animate-spin text-indigo-400" /></div> : (
                <div className="space-y-2">
                  {history.filter(h => h.tipo === 'nota').map(item => (
                    <div key={item.id} className="p-3 rounded-xl bg-amber-50 border border-amber-100 group relative">
                      <button onClick={() => deleteNote(item.id)}
                        className="absolute top-2 right-2 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Tipo de mensaje</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'reactivation', label: 'Invitar a volver', emoji: '👋' },
                    { key: 'quote_followup', label: 'Seguimiento cotización', emoji: '📋' },
                    { key: 'birthday', label: 'Cumpleaños', emoji: '🎂' },
                    { key: 'promo', label: 'Promoción', emoji: '🎁' },
                    { key: 'thanks', label: 'Agradecimiento', emoji: '🙏' },
                    { key: 'appointment_reminder', label: 'Recordatorio cita', emoji: '📅' },
                  ].map(t => (
                    <button key={t.key} onClick={() => { setContactMsgType(t.key); setContactMsgIndex(0) }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${contactMsgType === t.key ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {days > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <Clock size={12} />
                  {nombre} lleva {days} días sin visitar
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">Mensaje {contactMsgIndex + 1} de {(CONTACT_MESSAGES[contactMsgType] ?? CONTACT_MESSAGES.reactivation).length}</p>
                  <div className="flex gap-1">
                    <button onClick={nextContactMessage} title="Siguiente variante" className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><RefreshCw size={12} /></button>
                    <button onClick={copyContactMessage} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${contactMsgCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                      {contactMsgCopied ? <Check size={11} /> : <Copy size={11} />}
                      {contactMsgCopied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{getContactMessage()}</p>
                </div>
                {phone && (
                  <div className="px-4 pb-3">
                    <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(getContactMessage())}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                      <Send size={13} /> Abrir en WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
