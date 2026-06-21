'use client'

import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle2, Truck, AlertCircle, Plus, ChevronRight } from 'lucide-react'

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
  { key: 'received', label: 'Recibido', icon: Package, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'in_progress', label: 'En proceso', icon: Clock, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: 'ready', label: 'Listo', icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { key: 'delivered', label: 'Entregado', icon: Truck, color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
]

export default function EncargosKanban({ encargos: initialEncargos }: EncargosKanbanProps) {
  const [encargos, setEncargos] = useState(initialEncargos)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ itemDescription: '', price: '', serviceId: '', customerId: '', promisedDate: '', notifyWhatsapp: true })
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<{ id: string; name: string }[]>([])
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/servicios').then(r => r.json()).then(d => setServices(d || [])).catch(() => {})
    fetch('/api/clientes').then(r => r.json()).then(d => setCustomers(d || [])).catch(() => {})
  }, [])

  function formatPrice(price: string) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(price))
  }

  function formatDate(date: Date | null) {
    if (!date) return 'Sin fecha'
    return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  async function advanceStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/encargos/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
      if (res.ok) setEncargos(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
    } catch (err) { console.error('Error advancing status:', err) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.itemDescription || !newForm.price) return
    setSaving(true)
    try {
      const res = await fetch('/api/encargos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) })
      if (res.ok) { const data = await res.json(); setEncargos(prev => [data, ...prev]); setShowNew(false); setNewForm({ itemDescription: '', price: '', serviceId: '', customerId: '', promisedDate: '', notifyWhatsapp: true }) }
    } catch (err) { console.error('Error creating encargo:', err) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--c-fg)', margin: 0 }}>Encargos</h1>
          <p style={{ fontSize: '14px', color: 'var(--c-muted-fg)', marginTop: '4px' }}>Gestiona los encargos de tus clientes</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--c-primary)', color: '#fff', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Nuevo encargo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {COLUMNS.map(column => {
          const columnEncargos = encargos.filter(e => e.status === column.key)
          const Icon = column.icon
          return (
            <div key={column.key} style={{ borderRadius: 'var(--radius-lg)', border: `2px solid ${column.border}`, padding: 'var(--space-3)', minHeight: 200, background: column.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ width: 24, height: 24, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: column.color, color: '#fff' }}>
                  <Icon size={14} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-fg)' }}>{column.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 500, color: 'var(--c-muted-fg)', background: 'var(--c-surface)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>{columnEncargos.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {columnEncargos.map(encargo => (
                  <div key={encargo.id} style={{ background: 'var(--c-surface)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-muted-fg)' }}>{encargo.orderCode}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-fg)' }}>{formatPrice(encargo.price)}</span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', margin: '0 0 4px' }}>{encargo.itemDescription}</p>
                    {encargo.serviceName && <p style={{ fontSize: '11px', color: 'var(--c-muted-fg)', margin: '0 0 8px' }}>{encargo.serviceName}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--c-border)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--c-fg)' }}>{encargo.customerName || 'Sin cliente'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--c-muted-fg)' }}>{formatDate(encargo.promisedDate)}</span>
                    </div>
                    {column.key !== 'delivered' && (
                      <button onClick={() => advanceStatus(encargo.id, COLUMNS[COLUMNS.indexOf(column) + 1].key)} style={{ marginTop: 'var(--space-2)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius)', fontSize: '11px', fontWeight: 500, background: 'var(--c-muted)', color: 'var(--c-fg)', border: 'none', cursor: 'pointer' }}>
                        Avanzar a {COLUMNS[COLUMNS.indexOf(column) + 1].label} <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {columnEncargos.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--c-muted-fg)' }}>
                    <AlertCircle size={20} style={{ margin: '0 auto 4px', opacity: 0.5 }} />
                    <p style={{ fontSize: '11px' }}>Sin encargos</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showNew && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowNew(false)} />
          <div style={{ position: 'relative', background: 'var(--c-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 480, padding: 'var(--space-6)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--c-fg)', margin: '0 0 16px' }}>Nuevo encargo</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Descripción del artículo *</label>
                <input type="text" value={newForm.itemDescription} onChange={e => setNewForm(f => ({ ...f, itemDescription: e.target.value }))} placeholder="Ej: Camisa de vestir" style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Precio (COP) *</label>
                  <input type="number" value={newForm.price} onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))} placeholder="15000" style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Fecha estimada</label>
                  <input type="date" value={newForm.promisedDate} onChange={e => setNewForm(f => ({ ...f, promisedDate: e.target.value }))} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Servicio</label>
                <select value={newForm.serviceId} onChange={e => setNewForm(f => ({ ...f, serviceId: e.target.value }))} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }}>
                  <option value="">Seleccionar servicio</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Cliente</label>
                <select value={newForm.customerId} onChange={e => setNewForm(f => ({ ...f, customerId: e.target.value }))} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }}>
                  <option value="">Seleccionar cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px', color: 'var(--c-fg)' }}>
                <input type="checkbox" checked={newForm.notifyWhatsapp} onChange={e => setNewForm(f => ({ ...f, notifyWhatsapp: e.target.checked }))} />
                Notificar por WhatsApp cuando esté listo
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowNew(false)} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', fontWeight: 500, color: 'var(--c-fg)', background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving || !newForm.itemDescription || !newForm.price} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', background: 'var(--c-primary)', color: '#fff', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
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
