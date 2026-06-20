'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react'

interface VisitReason {
  id: string
  brandId: string
  name: string
  description: string | null
  sortOrder: number
  active: boolean
}

interface Props {
  reasons: VisitReason[]
}

export function VisitReasonsManager({ reasons: initial }: Props) {
  const [reasons, setReasons] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<VisitReason | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  // Drag and drop
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const sortedReasons = [...reasons].sort((a, b) => a.sortOrder - b.sortOrder)

  function openNew() {
    setEditing(null)
    setForm({ name: '', description: '' })
    setShowForm(true)
  }

  function openEdit(r: VisitReason) {
    setEditing(r)
    setForm({ name: r.name, description: r.description || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name) return
    setLoading(true)
    if (editing) {
      const res = await fetch(`/api/admin/visit-reasons/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, description: form.description || null }),
      })
      if (res.ok) {
        const updated = await res.json()
        setReasons(rs => rs.map(r => r.id === editing.id ? updated : r))
      }
    } else {
      const res = await fetch('/api/admin/visit-reasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, description: form.description || null }),
      })
      if (res.ok) {
        const created = await res.json()
        setReasons(rs => [...rs, created])
      }
    }
    setShowForm(false)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este motivo de visita?')) return
    await fetch(`/api/admin/visit-reasons/${id}`, { method: 'DELETE' })
    setReasons(rs => rs.filter(r => r.id !== id))
  }

  function handleDragStart(index: number) { dragItem.current = index; setDragging(index) }
  function handleDragEnter(index: number) { dragOver.current = index }

  async function handleDrop() {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      setDragging(null); return
    }
    const reordered = [...sortedReasons]
    const dragged = reordered[dragItem.current]
    reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, dragged)
    const updates = reordered.map((r, i) => ({ id: r.id, sortOrder: i }))
    setReasons(rs => {
      const map = Object.fromEntries(updates.map(u => [u.id, u.sortOrder]))
      return rs.map(r => map[r.id] !== undefined ? { ...r, sortOrder: map[r.id] } : r)
    })
    for (const u of updates) {
      await fetch(`/api/admin/visit-reasons/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: u.sortOrder }),
      })
    }
    dragItem.current = null; dragOver.current = null; setDragging(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Motivos de visita <span className="ml-1 text-sm font-normal text-gray-400">({reasons.length})</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Configura los motivos por los que tus clientes te visitan</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-1" /> Nuevo
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nuevo'} motivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {sortedReasons.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            No hay motivos configurados. Crea el primero.
          </div>
        )}
        {sortedReasons.length > 0 && (
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <GripVertical size={12} /> Arrastra para reordenar
          </p>
        )}
        {sortedReasons.map((r, index) => (
          <div
            key={r.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDrop}
            onDragOver={e => e.preventDefault()}
            className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all select-none ${
              dragging === index ? 'opacity-50 ring-2 ring-indigo-300' : 'hover:shadow-sm'
            }`}
          >
            <GripVertical size={16} className="text-gray-300 shrink-0" />
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{r.name}</p>
              {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
              <Trash2 size={14} className="text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
