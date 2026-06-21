'use client'

import { useState } from 'react'
import { Package, Clock, CheckCircle2, Truck, AlertCircle, Search, MapPin, Phone, Calendar, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EncargoData {
  id: string
  orderCode: string
  itemDescription: string
  status: string
  price: string
  promisedDate: Date | null
  createdAt: Date
  readyAt: Date | null
  deliveredAt: Date | null
  customerName: string | null
  customerPhone: string | null
  serviceName: string | null
  brandName: string | null
  brandAddress: string | null
  brandLogo: string | null
}

interface ClientPortalProps {
  encargo: EncargoData | null
  error: string | null
}

const STATUS_STEPS = [
  { key: 'received', label: 'Recibido', icon: Package, description: 'Tu encargo ha sido recibido' },
  { key: 'in_progress', label: 'En proceso', icon: Clock, description: 'Estamos trabajando en tu encargo' },
  { key: 'ready', label: 'Listo para recoger', icon: CheckCircle2, description: 'Tu encargo está listo' },
  { key: 'delivered', label: 'Entregado', icon: Truck, description: 'Tu encargo ha sido entregado' },
]

export default function ClientPortal({ encargo, error }: ClientPortalProps) {
  const [code, setCode] = useState('')
  const [doc, setDoc] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !doc.trim()) return
    setLoading(true)
    window.location.href = `/portal?code=${encodeURIComponent(code.trim())}&doc=${encodeURIComponent(doc.trim())}`
  }

  function formatPrice(price: string) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(price))
  }

  function formatDate(date: Date | null) {
    if (!date) return 'Pendiente'
    return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const currentStepIndex = encargo ? STATUS_STEPS.findIndex(s => s.key === encargo.status) : -1

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white">Turnflow</p>
          <p className="text-indigo-300 text-sm mt-1">Consulta el estado de tu encargo</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {!encargo ? (
            <form onSubmit={handleSearch} className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Consultar encargo</h1>
                <p className="text-sm text-gray-500 mt-1">Ingresa los datos de tu encargo para ver su estado</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Código de encargo</label>
                <div className="relative">
                  <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ej: ENC-001"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Número de documento</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ej: 1.234.567.890"
                    value={doc}
                    onChange={e => setDoc(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim() || !doc.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Search size={16} />
                Consultar
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Código</p>
                  <p className="text-lg font-bold text-gray-900">{encargo.orderCode}</p>
                </div>
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  encargo.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                  encargo.status === 'ready' ? 'bg-green-100 text-green-700' :
                  encargo.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                )}>
                  {STATUS_STEPS.find(s => s.key === encargo.status)?.label || encargo.status}
                </span>
              </div>

              {/* Progress steps */}
              <div className="space-y-3">
                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon
                  const isActive = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                      )}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-medium', isActive ? 'text-gray-900' : 'text-gray-400')}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Encargo details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Servicio</span>
                  <span className="text-sm font-medium text-gray-900">{encargo.serviceName || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Descripción</span>
                  <span className="text-sm font-medium text-gray-900">{encargo.itemDescription}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Precio</span>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(encargo.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Fecha estimada</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(encargo.promisedDate)}</span>
                </div>
              </div>

              {/* Brand info */}
              {encargo.brandName && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 mb-2">Negocio</p>
                  <p className="text-sm font-semibold text-gray-900">{encargo.brandName}</p>
                  {encargo.brandAddress && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin size={12} />
                      {encargo.brandAddress}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => window.location.href = '/portal'}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Consultar otro encargo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
