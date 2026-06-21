'use client'

import { useState, useEffect } from 'react'
import { Plus, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react'

interface Encargo {
  id: string
  orderCode: string
  itemDescription: string
  status: string
  price: string
  promisedDate: Date | null
  createdAt: Date
  customerName: string | null
  serviceName: string | null
}

interface Props {
  encargos: Encargo[]
}

const COLUMNS = [
  { key: 'received', label: 'Recibido', icon: Plus, color: 'sky', bg: 'bg-sky-50 dark:bg-sky-950', border: 'border-sky-200 dark:border-sky-800', headerBg: 'bg-sky-600' },
  { key: 'in_progress', label: 'En proceso', icon: Clock, color: 'amber', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800', headerBg: 'bg-amber-600' },
  { key: 'ready', label: 'Listo', icon: CheckCircle2, color: 'green', bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', headerBg: 'bg-green-600' },
  { key: 'delivered', label: 'Entregado', icon: Truck, color: 'purple', bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800', headerBg: 'bg-purple-600' },
]

const statusLabels: Record<string, { label: string; cls: string }> = {
  received:    { label: 'Recibido', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' },
  in_progress: { label: 'En proceso', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  ready:       { label: 'Listo', cls: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  delivered:   { label: 'Entregado', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  cancelled:   { label: 'Cancelado', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export default function EncargosKanban({ encargos: initial }: Props) {
  const [encargos, setEncargos] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ itemDescription: '', price: '', serviceId: '', customerId: '', promisedDate: '', notifyWhatsapp: true })
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<{ id: string; name: string }[]>([])
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/servicios').then(r => r.json()).then(d => setServices(d || [])).catch(() => {})
    fetch('/api/clientes').then(r => r.json()).then(d => setCustomers(d || [])).catch(() => {})
  }, [])

  async function advanceStatus(id: string, newStatus: string) {
    try {
      await fetch(`/api/encargos/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
      setEncargos(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
    } catch (err) { console.error(err) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.itemDescription || !newForm.price) return
    setSaving(true)
    try {
      const res = await fetch('/api/encargos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) })
      if (res.ok) { const data = await res.json(); setEncargos(prev => [data, ...prev]); setShowNew(false); setNewForm({ itemDescription: '', price: '', serviceId: '', customerId: '', promisedDate: '', notifyWhatsapp: true }) }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const nextCol = (key: string) => {
    const idx = COLUMNS.findIndex(c => c.key === key)
    return idx < COLUMNS.length - 1 ? COLUMNS[idx + 1].key : null
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Encargos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona los encargos de tus clientes</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700">
          <Plus size={16} /> Nuevo encargo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const items = encargos.filter(e => e.status === col.key)
          const Icon = col.icon
          return (
            <div key={col.key} className={`${col.bg} border-2 ${col.border} rounded-xl p-3 min-h-48`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-md ${col.headerBg} flex items-center justify-center text-white`}>
                  <Icon size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{col.label}</span>
                <span className="ml-auto text-xs font-medium text-gray-500 bg-white dark:bg-gray-800 rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map(encargo => (
                  <div key={encargo.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] font-mono text-gray-400">{encargo.orderCode}</span>
                      <span className="text-[11px] font-semibold text-gray-900 dark:text-white">${Number(encargo.price).toLocaleString('es-CO')}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{encargo.itemDescription}</p>
                    {encargo.serviceName && <p className="text-[11px] text-gray-500 mb-2">{encargo.serviceName}</p>}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[11px] text-gray-700 dark:text-gray-300">{encargo.customerName || 'Sin cliente'}</span>
                      <span className="text-[11px] text-gray-400">{encargo.promisedDate ? new Date(encargo.promisedDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Sin fecha'}</span>
                    </div>
                    {nextCol(col.status) && (
                      <button onClick={() => advanceStatus(encargo.id, nextCol(col.status)!)}
                        className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                        Avanzar →
                      </button>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <AlertCircle size={20} className="mx-auto mb-1 opacity-50" />
                    <p className="text-[11px]">Sin encargos</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* New encargo modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNew(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nuevo encargo</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del artículo *</label>
                <input type="text" value={newForm.itemDescription} onChange={e => setNewForm(f => ({ ...f, itemDescription: e.target.value }))} placeholder="Ej: Camisa de vestir" required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio (COP) *</label>
                  <input type="number" value={newForm.price} onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))} placeholder="15000" required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha estimada</label>
                  <input type="date" value={newForm.promisedDate} onChange={e => setNewForm(f => ({ ...f, promisedDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servicio</label>
                <select value={newForm.serviceId} onChange={e => setNewForm(f => ({ ...f, serviceId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500">
                  <option value="">Seleccionar servicio</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
                <select value={newForm.customerId} onChange={e => setNewForm(f => ({ ...f, customerId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500">
                  <option value="">Seleccionar cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                <button type="submit" disabled={saving || !newForm.itemDescription || !newForm.price}
                  className="flex-1 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50">
                  {saving ? 'Creando...' : 'Crear encargo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
