import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { promotions } from '@/lib/db/schema'
import { eq, desc } from '@lynkko/db'
import { getContext } from '@/lib/context'
import Link from 'next/link'
import { Plus, Megaphone, Calendar, Tag } from 'lucide-react'

export default async function PromotionsPage() {
  const ctx = await getContext()

  const promos = await db
    .select()
    .from(promotions)
    .where(eq(promotions.establishmentId, ctx.establishmentId!))
    .orderBy(desc(promotions.createdAt))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea y gestiona promociones para tus clientes
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} />
          Nueva promoción
        </button>
      </div>

      {promos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Megaphone size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Sin promociones</h3>
          <p className="text-sm text-gray-500 mb-4">
            Crea tu primera promoción para atraer más clientes
          </p>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            Crear promoción
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map(promo => (
            <div key={promo.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{promo.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  promo.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {promo.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              {promo.description && (
                <p className="text-sm text-gray-600 mb-3">{promo.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {promo.startsAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Desde: {new Date(promo.startsAt).toLocaleDateString('es-CO')}
                  </span>
                )}
                {promo.endsAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Hasta: {new Date(promo.endsAt).toLocaleDateString('es-CO')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
