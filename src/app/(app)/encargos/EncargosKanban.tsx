'use client'

import { useState } from 'react'
import { Package, Clock, CheckCircle2, Truck, AlertCircle, Plus, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Encargo {
  id: string
  orderCode: string
  itemDescription: string
  status: string
  price: string
  promisedDate: Date | null
  createdAt: Date
  customerId: string | null
  customerName: string | null
  customerPhone: string | null
  serviceName: string | null
}

interface EncargosKanbanProps {
  encargos: Encargo[]
}

const COLUMNS = [
  { key: 'received', label: 'Recibido', icon: Package, color: 'bg-blue-500', lightColor: 'bg-blue-50 border-blue-200', next: 'in_progress' },
  { key: 'in_progress', label: 'En proceso', icon: Clock, color: 'bg-amber-500', lightColor: 'bg-amber-50 border-amber-200', next: 'ready' },
  { key: 'ready', label: 'Listo', icon: CheckCircle2, color: 'bg-green-500', lightColor: 'bg-green-50 border-green-200', next: 'delivered' },
  { key: 'delivered', label: 'Entregado', icon: Truck, color: 'bg-purple-500', lightColor: 'bg-purple-50 border-purple-200', next: null },
]

export default function EncargosKanban({ encargos: initialEncargos }: EncargosKanbanProps) {
  const [encargos, setEncargos] = useState(initialEncargos)
  const [showNew, setShowNew] = useState(false)

  function formatPrice(price: string) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(price))
  }

  function formatDate(date: Date | null) {
    if (!date) return 'Sin fecha'
    return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  async function advanceStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/encargos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setEncargos(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
      }
    } catch (err) {
      console.error('Error advancing status:', err)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encargos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los encargos de tus clientes</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} />
          Nuevo encargo
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(column => {
          const columnEncargos = encargos.filter(e => e.status === column.key)
          const Icon = column.icon

          return (
            <div key={column.key} className={cn('rounded-xl border-2 p-3 min-h-[200px]', column.lightColor)}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-white', column.color)}>
                  <Icon size={14} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{column.label}</h3>
                <span className="ml-auto text-xs font-medium text-gray-500 bg-white rounded-full px-2 py-0.5">
                  {columnEncargos.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnEncargos.map(encargo => (
                  <div key={encargo.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-mono text-gray-400">{encargo.orderCode}</span>
                      <span className="text-xs font-semibold text-gray-900">{formatPrice(encargo.price)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{encargo.itemDescription}</p>
                    {encargo.serviceName && (
                      <p className="text-xs text-gray-500 mb-2">{encargo.serviceName}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-600">{encargo.customerName || 'Sin cliente'}</span>
                      <span className="text-xs text-gray-400">{formatDate(encargo.promisedDate)}</span>
                    </div>
                    {column.next && (
                      <button
                        onClick={() => advanceStatus(encargo.id, column.next!)}
                        className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Avanzar a {COLUMNS.find(c => c.key === column.next)?.label}
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {columnEncargos.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    <AlertCircle size={20} className="mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Sin encargos</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
