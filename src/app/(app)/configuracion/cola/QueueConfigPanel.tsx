'use client'

import { useState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'

type Reason = { id: string; name: string; description: string | null; active: boolean }
type Field  = { id: string; label: string; fieldType: string; required: boolean; active: boolean; options: string[] | null }

const FIELD_TYPES = [
  { value: 'text',     label: 'Texto' },
  { value: 'number',   label: 'Número' },
  { value: 'select',   label: 'Lista desplegable' },
  { value: 'checkbox', label: 'Casilla de verificación' },
  { value: 'date',     label: 'Fecha' },
]

export function QueueConfigPanel({ initialReasons, initialFields }: {
  initialReasons: Reason[]
  initialFields:  Field[]
}) {
  const [reasons, setReasons] = useState(initialReasons)
  const [fields, setFields]   = useState(initialFields)
  const [newReason, setNewReason] = useState('')
  const [saving, setSaving]   = useState<string | null>(null)

  const [newField, setNewField] = useState({
    label: '', fieldType: 'text', required: false, options: '',
  })

  async function addReason() {
    if (!newReason.trim()) return
    setSaving('reason')
    const res = await fetch('/api/admin/visit-reasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newReason.trim() }),
    })
    if (res.ok) {
      const row = await res.json()
      setReasons(r => [...r, row])
      setNewReason('')
    }
    setSaving(null)
  }

  async function deleteReason(id: string) {
    await fetch(`/api/admin/visit-reasons/${id}`, { method: 'DELETE' })
    setReasons(r => r.filter(x => x.id !== id))
  }

  async function toggleReason(r: Reason) {
    const res = await fetch(`/api/admin/visit-reasons/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !r.active }),
    })
    if (res.ok) setReasons(list => list.map(x => x.id === r.id ? { ...x, active: !x.active } : x))
  }

  async function addField() {
    if (!newField.label.trim()) return
    setSaving('field')
    const options = newField.fieldType === 'select'
      ? newField.options.split('\n').map(s => s.trim()).filter(Boolean)
      : null
    const res = await fetch('/api/admin/advisor-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newField, options }),
    })
    if (res.ok) {
      const row = await res.json()
      setFields(f => [...f, row])
      setNewField({ label: '', fieldType: 'text', required: false, options: '' })
    }
    setSaving(null)
  }

  async function deleteField(id: string) {
    await fetch(`/api/admin/advisor-fields/${id}`, { method: 'DELETE' })
    setFields(f => f.filter(x => x.id !== id))
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Visit reasons */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Motivos de visita</h2>
        <p className="text-sm text-gray-500 mb-4">El cliente los selecciona al tomar turno</p>

        <ul className="flex flex-col gap-2 mb-4">
          {reasons.length === 0 && (
            <p className="text-sm text-gray-400">Sin motivos configurados</p>
          )}
          {reasons.map(r => (
            <li key={r.id} className="flex items-center gap-3">
              <button
                onClick={() => toggleReason(r)}
                className={`w-2 h-2 rounded-full shrink-0 ${r.active ? 'bg-green-500' : 'bg-gray-300'}`}
                title={r.active ? 'Activo' : 'Inactivo'}
              />
              <span className={`flex-1 text-sm ${r.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{r.name}</span>
              <button onClick={() => deleteReason(r.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <input
            type="text"
            value={newReason}
            onChange={e => setNewReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addReason()}
            placeholder="Ej: Apertura de cuenta, Solicitud de crédito..."
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={addReason}
            disabled={saving === 'reason' || !newReason.trim()}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving === 'reason' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Agregar
          </button>
        </div>
      </section>

      {/* Advisor fields */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Campos del formulario de atención</h2>
        <p className="text-sm text-gray-500 mb-4">El asesor los llena al atender cada turno</p>

        <ul className="flex flex-col gap-2 mb-4">
          {fields.length === 0 && (
            <p className="text-sm text-gray-400">Sin campos configurados</p>
          )}
          {fields.map(f => (
            <li key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{f.label}</p>
                <p className="text-xs text-gray-400">
                  {FIELD_TYPES.find(t => t.value === f.fieldType)?.label}
                  {f.required ? ' · Requerido' : ''}
                </p>
              </div>
              <button onClick={() => deleteField(f.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 p-4 rounded-xl border border-dashed border-gray-300">
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Etiqueta</label>
              <input
                type="text"
                value={newField.label}
                onChange={e => setNewField(p => ({ ...p, label: e.target.value }))}
                placeholder="Ej: Número de cuenta, Producto de interés..."
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-medium text-gray-600">Tipo</label>
              <select
                value={newField.fieldType}
                onChange={e => setNewField(p => ({ ...p, fieldType: e.target.value }))}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white"
              >
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {newField.fieldType === 'select' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Opciones (una por línea)</label>
              <textarea
                value={newField.options}
                onChange={e => setNewField(p => ({ ...p, options: e.target.value }))}
                rows={3}
                placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={e => setNewField(p => ({ ...p, required: e.target.checked }))}
                className="rounded"
              />
              Campo requerido
            </label>
            <button
              onClick={addField}
              disabled={saving === 'field' || !newField.label.trim()}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving === 'field' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Agregar campo
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
