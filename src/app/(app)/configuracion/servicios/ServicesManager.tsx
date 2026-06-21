'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Package, Clock, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description: string | null
  price: string
  durationDays: number
  isActive: boolean
  sortOrder: number
}

interface ServicesManagerProps {
  services: Service[]
}

export default function ServicesManager({ services: initialServices }: ServicesManagerProps) {
  const [services, setServices] = useState(initialServices)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', durationDays: 3 })

  function openNew() {
    setForm({ name: '', description: '', price: '', durationDays: 3 })
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(s: Service) {
    setForm({ name: s.name, description: s.description || '', price: s.price, durationDays: s.durationDays })
    setEditing(s)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) return

    try {
      const res = await fetch('/api/admin/servicios', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          id: editing?.id,
          price: parseFloat(form.price),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (editing) {
          setServices(prev => prev.map(s => s.id === editing.id ? data : s))
        } else {
          setServices(prev => [...prev, data])
        }
        setShowForm(false)
      }
    } catch (err) {
      console.error('Error saving service:', err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return
    try {
      const res = await fetch(`/api/admin/servicios/${id}`, { method: 'DELETE' })
      if (res.ok) setServices(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Error deleting service:', err)
    }
  }

  function formatPrice(price: string) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(price))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los servicios que ofrece tu negocio</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} />
          Nuevo servicio
        </button>
      </div>

      {/* Services list */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Sin servicios</h3>
          <p className="text-sm text-gray-500 mb-4">Crea tu primer servicio para comenzar a recibir encargos</p>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Crear servicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Package size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{service.name}</h3>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {service.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{service.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <DollarSign size={12} />
                    {formatPrice(service.price)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {service.durationDays} días
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(service)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editing ? 'Editar servicio' : 'Nuevo servicio'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Lavado básico"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe el servicio..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio (COP)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="15000"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración (días)</label>
                  <input
                    type="number"
                    value={form.durationDays}
                    onChange={e => setForm(f => ({ ...f, durationDays: parseInt(e.target.value) || 1 }))}
                    min={1}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.price}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {editing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
