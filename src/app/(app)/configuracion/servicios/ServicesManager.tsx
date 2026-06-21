'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Package, Clock, DollarSign, Search, X } from 'lucide-react'

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
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', description: '', price: '', durationDays: 3 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setServices(initialServices) }, [initialServices])

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  )

  function openNew() { setForm({ name: '', description: '', price: '', durationDays: 3 }); setEditing(null); setError(''); setShowForm(true) }
  function openEdit(s: Service) { setForm({ name: s.name, description: s.description || '', price: s.price, durationDays: s.durationDays }); setEditing(s); setError(''); setShowForm(true) }

  async function handleSave() {
    if (!form.name.trim() || !form.price) { setError('Nombre y precio son requeridos'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(editing ? `/api/admin/servicios/${editing.id}` : '/api/admin/servicios', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, price: parseFloat(form.price) }) })
      if (res.ok) { const data = await res.json(); if (editing) setServices(prev => prev.map(s => s.id === editing.id ? { ...s, ...data } : s)); else setServices(prev => [...prev, data]); setShowForm(false) }
      else { const err = await res.json(); setError(err.error || 'Error al guardar') }
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    try { const res = await fetch(`/api/admin/servicios/${id}`, { method: 'DELETE' }); if (res.ok) setServices(prev => prev.filter(s => s.id !== id)) } catch { console.error('Error deleting service') }
  }

  function formatPrice(price: string) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(price))
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--c-fg)', margin: 0 }}>Servicios</h1>
          <p style={{ fontSize: '14px', color: 'var(--c-muted-fg)', marginTop: '4px' }}>Gestiona los servicios que ofrece tu negocio</p>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--c-primary)', color: '#fff', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
        <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted-fg)' }} />
        <input type="text" placeholder="Buscar servicios..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center' }}>
          <Package size={48} style={{ margin: '0 auto 16px', color: 'var(--c-muted-fg)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--c-fg)', margin: '0 0 4px' }}>{search ? 'No se encontraron servicios' : 'Sin servicios'}</h3>
          <p style={{ fontSize: '14px', color: 'var(--c-muted-fg)', margin: '0 0 16px' }}>{search ? 'Intenta con otra búsqueda' : 'Crea tu primer servicio para comenzar'}</p>
          {!search && <button onClick={openNew} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--c-primary)', color: '#fff', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>Crear servicio</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map(service => (
            <div key={service.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--c-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-primary)' }}>
                <Package size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-fg)', margin: 0 }}>{service.name}</h3>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 500, background: service.isActive ? 'var(--c-success-bg)' : 'var(--c-muted)', color: service.isActive ? 'var(--c-success)' : 'var(--c-muted-fg)' }}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {service.description && <p style={{ fontSize: '12px', color: 'var(--c-muted-fg)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--c-muted-fg)' }}><DollarSign size={12} />{formatPrice(service.price)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--c-muted-fg)' }}><Clock size={12} />{service.durationDays} días</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={() => openEdit(service)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius)', border: 'none', background: 'transparent', color: 'var(--c-muted-fg)', cursor: 'pointer' }}><Edit2 size={15} /></button>
                <button onClick={() => handleDelete(service.id)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius)', border: 'none', background: 'transparent', color: 'var(--c-muted-fg)', cursor: 'pointer' }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowForm(false)} />
          <div style={{ position: 'relative', background: 'var(--c-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 480, padding: 'var(--space-6)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--c-fg)', margin: 0 }}>{editing ? 'Editar servicio' : 'Nuevo servicio'}</h2>
              <button onClick={() => setShowForm(false)} style={{ padding: 'var(--space-1)', borderRadius: 'var(--radius)', border: 'none', background: 'transparent', color: 'var(--c-muted-fg)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Lavado básico" style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe el servicio..." rows={2} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)', resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Precio (COP) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="15000" style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--space-1)' }}>Duración (días)</label>
                  <input type="number" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: parseInt(e.target.value) || 1 }))} min={1} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', background: 'var(--c-surface)', color: 'var(--c-fg)' }} />
                </div>
              </div>
              {error && <p style={{ fontSize: '13px', color: 'var(--c-destructive)', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)', fontSize: '14px', fontWeight: 500, color: 'var(--c-fg)', background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.price} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', background: 'var(--c-primary)', color: '#fff', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
