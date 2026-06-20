import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiKeys, webhookEndpoints } from '@/lib/db/schema'
import { eq, desc } from '@lynkko/db'
import { getContext } from '@/lib/context'
import { Key, Webhook, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react'

export default async function IntegracionesPage() {
  const ctx = await getContext()

  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.brandId, ctx.brandId))
    .orderBy(desc(apiKeys.createdAt))

  const webhooks = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.brandId, ctx.brandId))
    .orderBy(desc(webhookEndpoints.createdAt))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Integraciones</h1>
      <p className="text-sm text-gray-500 mb-6">
        Conecta tu negocio con las aplicaciones del ecosistema Lynkko y servicios externos
      </p>

      {/* API Keys */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key size={20} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus size={14} />
            Nueva clave
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Key size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No tienes API keys configuradas</p>
            <p className="text-xs text-gray-400 mt-1">Crea una clave para integrar servicios externos</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prefijo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Creada</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(key => (
                  <tr key={key.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{key.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{key.keyPrefix}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        key.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {key.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(key.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Webhooks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Webhook size={20} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus size={14} />
            Nuevo webhook
          </button>
        </div>

        {webhooks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Webhook size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No tienes webhooks configurados</p>
            <p className="text-xs text-gray-400 mt-1">
              Configura webhooks para recibir eventos de otras aplicaciones Lynkko
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">URL</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Eventos</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map(wh => (
                  <tr key={wh.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{wh.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono truncate max-w-[200px]">{wh.url}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {wh.events?.join(', ') || 'Todos'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        wh.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {wh.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ecosystem integrations */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Integraciones con el ecosistema Lynkko</h3>
        <p className="text-sm text-gray-600 mb-4">
          Conecta con otras aplicaciones de Lynkko para potenciar tu negocio
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'Lynkko Customer', desc: 'PQRS y soporte al cliente', status: 'available' },
            { name: 'Lynkko Facturación', desc: 'Facturación electrónica DIAN', status: 'available' },
            { name: 'Lynkko Encuestas', desc: 'NPS y satisfacción', status: 'available' },
            { name: 'Lynkko Contabilidad', desc: 'Contabilidad NIIF', status: 'available' },
          ].map(integration => (
            <div key={integration.name} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                <p className="text-xs text-gray-500">{integration.desc}</p>
              </div>
              <button className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                Conectar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
