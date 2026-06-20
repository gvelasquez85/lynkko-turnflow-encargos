import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brands } from '@/lib/db/schema'
import { eq } from '@lynkko/db'

const LYNKKO_PRODUCTS = [
  {
    id: 'lynkko-customer',
    name: 'Lynkko Customer',
    description: 'Gestión de PQRS, solicitudes y casos con trazabilidad completa. El cliente puede consultar el estado sin contactar al equipo.',
    icon: 'MessageSquareWarning',
    color: 'bg-gray-600',
    priceMonthly: 149900,
    category: 'Soporte',
    features: ['Portal externo de PQRS', 'Trazabilidad interna', 'Escalación automática', 'SLA configurable'],
  },
  {
    id: 'lynkko-facturacion',
    name: 'Lynkko Facturación',
    description: 'Facturación electrónica DIAN para Colombia. Genera facturas desde eventos del ecosistema o CSV/API.',
    icon: 'Receipt',
    color: 'bg-amber-600',
    priceMonthly: 129900,
    category: 'Facturación',
    features: ['Facturación electrónica DIAN', 'Integración vía API', 'Eventos del ecosistema', 'Resoluciones y numeración'],
  },
  {
    id: 'lynkko-encuestas',
    name: 'Lynkko Encuestas',
    description: 'Encuestas NPS/CSAT para medir la satisfacción de tus clientes. Envía automáticamente después de cada atención.',
    icon: 'ClipboardList',
    color: 'bg-violet-600',
    priceMonthly: 79900,
    category: 'Feedback',
    features: ['Encuestas NPS/CSAT', 'Envío automático', 'Reportes en tiempo real', 'Segmentación por atención'],
  },
  {
    id: 'lynkko-contabilidad',
    name: 'Lynkko Contabilidad',
    description: 'Contabilidad NIIF para Colombia. PUC, asientos, períodos y reportes financieros desde tus ventas.',
    icon: 'BookOpen',
    color: 'bg-emerald-600',
    priceMonthly: 109900,
    category: 'Finanzas',
    features: ['PUC configurable', 'Asientos automáticos', 'Períodos contables', 'Reportes NIIF'],
  },
  {
    id: 'lynkko-help',
    name: 'Lynkko Help',
    description: 'Centro de ayuda y base de conocimiento self-service. Reduce la carga de soporte con FAQs y diagnóstico guiado.',
    icon: 'HelpCircle',
    color: 'bg-teal-600',
    priceMonthly: 69900,
    category: 'Soporte',
    features: ['FAQs y documentación', 'Diagnóstico guiado', 'Escalación a Customer', 'Base de conocimiento'],
  },
]

export default async function MarketplacePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string; brandId?: string }

  // Get current brand's active modules
  let activeModules: string[] = []
  if (user.brandId) {
    const [brand] = await db.select({ activeModules: brands.activeModules }).from(brands).where(eq(brands.id, user.brandId)).limit(1)
    if (brand?.activeModules) {
      const modules = brand.activeModules as Record<string, boolean>
      activeModules = Object.entries(modules).filter(([, v]) => v).map(([k]) => k)
    }
  }

  const categories = [...new Set(LYNKKO_PRODUCTS.map(p => p.category))]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-sm text-gray-500 mt-1">
          Amplía las capacidades de tu negocio con las aplicaciones del ecosistema Lynkko
        </p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <span key={cat} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
            {cat}
          </span>
        ))}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LYNKKO_PRODUCTS.map(product => {
          const isActive = activeModules.includes(product.id)
          return (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${product.color} flex items-center justify-center text-white text-lg`}>
                  {product.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                {isActive && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4 flex-1">{product.description}</p>
              <div className="space-y-1 mb-4">
                {product.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1 h-1 rounded-full bg-indigo-400" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-lg font-bold text-gray-900">
                  ${product.priceMonthly.toLocaleString('es-CO')}<span className="text-xs font-normal text-gray-400">/mes</span>
                </p>
                {isActive ? (
                  <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700">
                    ✓ Instalado
                  </span>
                ) : (
                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                    Instalar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
