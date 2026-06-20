import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { waTemplates, waDefaultTemplates } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'
import { getContext } from '@/lib/context'

const TEMPLATE_CATEGORIES = [
  { key: 'encargo_listo', label: 'Encargo listo', description: 'Notifica al cliente que su encargo está listo para recoger' },
  { key: 'encargo_recibido', label: 'Encargo recibido', description: 'Confirmación de recepción del encargo' },
  { key: 'encargo_retraso', label: 'Aviso de retraso', description: 'Notifica un retraso en el encargo' },
  { key: 'sale_receipt', label: 'Comprobante de venta', description: 'Envía el comprobante de una venta' },
  { key: 'customer_reactivation', label: 'Reactivación de cliente', description: 'Mensaje para recuperar clientes inactivos' },
]

export default async function MensajesPage() {
  const ctx = await getContext()

  const templates = await db
    .select()
    .from(waTemplates)
    .where(eq(waTemplates.brandId, ctx.brandId))

  const defaultTemplates = await db.select().from(waDefaultTemplates)

  const templateMap = new Map(templates.map(t => [t.category, t]))
  const defaultMap = new Map(defaultTemplates.map(t => [t.category, t]))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mensajes WhatsApp</h1>
      <p className="text-sm text-gray-500 mb-6">
        Configura los mensajes automáticos que se envían a tus clientes
      </p>

      <div className="space-y-4">
        {TEMPLATE_CATEGORIES.map(cat => {
          const custom = templateMap.get(cat.key as any)
          const defaultTmpl = defaultMap.get(cat.key as any)
          const isActive = custom?.isActive ?? true
          const body = custom?.body ?? defaultTmpl?.body ?? ''

          return (
            <div key={cat.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">{isActive ? 'Activo' : 'Inactivo'}</span>
                  <div className={`w-9 h-5 rounded-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${isActive ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>
              <textarea
                defaultValue={body}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                placeholder="Escribe el mensaje..."
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  Variables disponibles: {'{{nombre}}'}, {'{{negocio}}'}, {'{{servicio}}'}, {'{{fecha_entrega}}'}
                </p>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700">
                  Guardar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
