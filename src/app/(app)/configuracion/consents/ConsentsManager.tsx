'use client'
import { useState } from 'react'
import { Shield, Download, Search, Check } from 'lucide-react'

interface Consent {
  id: string
  ticketId: string | null
  establishmentId: string | null
  brandId: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  marketingOptIn: boolean
  dataProcessingConsent: boolean
  consentedAt: string
  establishmentName?: string | null
  ticketQueueNumber?: string | null
}

interface Props {
  consents: Consent[]
}

export function ConsentsManager({ consents }: Props) {
  const [search, setSearch] = useState('')

  const filtered = consents.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.customerName.toLowerCase().includes(q) ||
      (c.customerPhone || '').includes(q) ||
      (c.customerEmail || '').toLowerCase().includes(q)
  })

  function downloadCertificate(consentId: string) {
    window.open(`/api/consent/download?consentId=${consentId}`, '_blank')
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Autorizaciones de datos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} registros</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o correo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p>Sin registros de consentimiento</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <div className="col-span-2">Cliente</div>
              <div className="col-span-2">Contacto</div>
              <div className="col-span-3">Sucursal</div>
              <div className="col-span-1 text-center">Turno</div>
              <div className="col-span-2 text-center">Autor.</div>
              <div className="col-span-1">Fecha</div>
              <div className="col-span-1 text-center">PDF</div>
            </div>
            {filtered.map(c => (
              <div key={c.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50 text-sm">
                <div className="col-span-2">
                  <p className="font-medium text-gray-900 truncate">{c.customerName}</p>
                </div>
                <div className="col-span-2 text-gray-500 text-xs">
                  {c.customerPhone && <p>{c.customerPhone}</p>}
                  {c.customerEmail && <p className="truncate">{c.customerEmail}</p>}
                </div>
                <div className="col-span-3 text-gray-600 truncate text-xs">
                  {c.establishmentName ?? <span className="text-gray-400 italic">Sucursal eliminada</span>}
                </div>
                <div className="col-span-1 text-center text-xs text-gray-500">
                  #{c.ticketQueueNumber || '—'}
                </div>
                <div className="col-span-2 flex flex-col items-start gap-1">
                  <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${c.dataProcessingConsent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {c.dataProcessingConsent && <Check size={10} />} Datos
                  </span>
                  <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${c.marketingOptIn ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    {c.marketingOptIn && <Check size={10} />} Mktg
                  </span>
                </div>
                <div className="col-span-1 text-xs text-gray-400">
                  {new Date(c.consentedAt).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => downloadCertificate(c.id)}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"
                    title="Descargar certificado PDF"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
