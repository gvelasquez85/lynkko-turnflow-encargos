'use client'
import { useState } from 'react'
import { Plus, Edit2, KeyRound, User, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type UserRole = 'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting'

type UserRow = {
  id: string
  email: string
  name: string | null
  role: UserRole
  establishmentId: string | null
  establishmentName: string | null
}

const BRAND_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'advisor',   label: 'Agente',    description: 'Encargado de atención de clientes' },
  { value: 'reporting', label: 'Reporting', description: 'Solo accede a reportes' },
]

const roleColors: Partial<Record<UserRole, string>> = {
  advisor:     'bg-green-100 text-green-700',
  manager:     'bg-blue-100 text-blue-700',
  reporting:   'bg-amber-100 text-amber-700',
  brand_admin: 'bg-indigo-100 text-indigo-700',
}

export function UsersPanel({
  users: initial,
  establishments,
  maxAdvisors,
  estUserCounts = {},
  availableExtraSlots = 0,
}: {
  users: UserRow[]
  establishments: { id: string; name: string }[]
  maxAdvisors?: number
  estUserCounts?: Record<string, number>
  availableExtraSlots?: number
}) {
  const [userList, setUserList] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [form, setForm] = useState({
    email: '', password: '', name: '',
    role: 'advisor' as UserRole,
    establishmentId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [pwModal, setPwModal] = useState<{ userId: string; email: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<UserRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  const teamCount = userList.filter(u => u.role !== 'brand_admin').length
  const selectableUsers = userList.filter(u => u.role !== 'brand_admin')

  function toggleSelect(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleSelectAll() {
    if (selected.size === selectableUsers.length) setSelected(new Set())
    else setSelected(new Set(selectableUsers.map(u => u.id)))
  }

  function openNew() {
    setEditing(null)
    setForm({ email: '', password: '', name: '', role: 'advisor', establishmentId: '' })
    setError('')
    setShowForm(true)
  }

  function openEdit(u: UserRow) {
    setEditing(u)
    setForm({ email: u.email, password: '', name: u.name || '', role: u.role, establishmentId: u.establishmentId || '' })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setError(''); setLoading(true)

    if (!editing && maxAdvisors !== undefined && teamCount >= maxAdvisors) {
      setError(`Tu plan permite hasta ${maxAdvisors} usuario${maxAdvisors === 1 ? '' : 's'} (el administrador no cuenta). Actualiza tu membresía en Mi marca → Membresía.`)
      setLoading(false)
      return
    }

    if (editing) {
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          establishmentId: form.establishmentId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); setLoading(false); return }
      setUserList(us => us.map(u => u.id === editing.id ? {
        ...u,
        name: form.name,
        role: form.role,
        establishmentId: form.establishmentId || null,
        establishmentName: establishments.find(e => e.id === form.establishmentId)?.name ?? null,
      } : u))
      setShowForm(false)
    } else {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          establishmentId: form.establishmentId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); setLoading(false); return }
      window.location.reload()
      return
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setDeleteLoading(true); setDeleteError('')
    const res = await fetch(`/api/admin/users/${deleteConfirm.id}`, { method: 'DELETE' })
    const json = await res.json()
    setDeleteLoading(false)
    if (!res.ok) { setDeleteError(json.error); return }
    setUserList(us => us.filter(u => u.id !== deleteConfirm.id))
    setSelected(s => { const n = new Set(s); n.delete(deleteConfirm.id); return n })
    setDeleteConfirm(null)
  }

  async function handleBulkDelete() {
    setBulkLoading(true)
    const ids = Array.from(selected)
    const results = await Promise.all(
      ids.map(id => fetch(`/api/admin/users/${id}`, { method: 'DELETE' }).then(r => r.json()))
    )
    setBulkLoading(false)
    const failed = results.filter(r => r.error)
    if (failed.length > 0) { setDeleteError(failed[0].error); setBulkDeleteConfirm(false); return }
    setUserList(us => us.filter(u => !selected.has(u.id)))
    setSelected(new Set())
    setBulkDeleteConfirm(false)
  }

  async function handleSetPassword() {
    if (!pwModal) return
    setPwError(''); setPwLoading(true); setPwSuccess(false)
    const res = await fetch(`/api/admin/users/${pwModal.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    const json = await res.json()
    setPwLoading(false)
    if (!res.ok) { setPwError(json.error); return }
    setPwSuccess(true)
    setTimeout(() => { setPwModal(null); setNewPassword(''); setPwSuccess(false) }, 1500)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Equipo
            <span className="ml-1 text-sm font-normal text-gray-400">
              ({teamCount}{maxAdvisors !== undefined ? `/${maxAdvisors}` : ''})
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Asesores, managers y usuarios de reportes</p>
        </div>
        <Button
          onClick={openNew}
          disabled={maxAdvisors !== undefined && teamCount >= maxAdvisors}
          title={maxAdvisors !== undefined && teamCount >= maxAdvisors
            ? `Límite de ${maxAdvisors} usuario${maxAdvisors === 1 ? '' : 's'} alcanzado`
            : undefined}
        >
          <Plus size={16} className="mr-1" /> Nuevo usuario
        </Button>
      </div>

      {maxAdvisors !== undefined && teamCount >= maxAdvisors && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            Alcanzaste el límite de <strong>{maxAdvisors} usuario{maxAdvisors === 1 ? '' : 's'}</strong> de tu plan.{' '}
            <a href="/configuracion/marca?tab=membership" className="underline font-semibold hover:text-amber-900">
              Ir a membresía para agregar más →
            </a>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {BRAND_ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${roleColors[r.value]}`}>{r.label}</span>
            <p className="text-xs text-gray-500">{r.description}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nuevo'} usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editing && <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />}
            {!editing && <Input label="Contraseña *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />}
            <Input label="Nombre completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Select
              label="Rol *"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole, establishmentId: '' }))}
            >
              {BRAND_ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.description}</option>)}
            </Select>
            {form.role === 'advisor' && (
              <div>
                <Select
                  label="Sucursal"
                  value={form.establishmentId}
                  onChange={e => setForm(f => ({ ...f, establishmentId: e.target.value }))}
                >
                  <option value="">Sin sucursal asignada</option>
                  {establishments.map(e => {
                    const count = estUserCounts[e.id] ?? 0
                    const atLimit = count >= 2 && availableExtraSlots <= 0
                    return (
                      <option key={e.id} value={e.id} disabled={atLimit}>
                        {e.name} — {count}/2 usuarios{count >= 2 ? ' (lleno)' : ''}
                      </option>
                    )
                  })}
                </Select>
                {form.establishmentId && (estUserCounts[form.establishmentId] ?? 0) >= 2 && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>
                      Esta sucursal ya tiene los 2 usuarios incluidos.{' '}
                      {availableExtraSlots > 0
                        ? `Tienes ${availableExtraSlots} slot${availableExtraSlots !== 1 ? 's' : ''} adicional${availableExtraSlots !== 1 ? 'es' : ''} disponible${availableExtraSlots !== 1 ? 's' : ''}.`
                        : <><a href="/configuracion/marca?tab=membership" className="underline font-semibold">Amplía tu capacidad</a> para agregar más.</>
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-700">
            {selected.size} usuario{selected.size === 1 ? '' : 's'} seleccionado{selected.size === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSelected(new Set())}>Cancelar</Button>
            <Button size="sm" onClick={() => { setBulkDeleteConfirm(true); setDeleteError('') }}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600">
              <Trash2 size={13} className="mr-1" /> Eliminar seleccionados
            </Button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">
          {deleteError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {selectableUsers.length > 0 && (
          <div className="flex items-center gap-3 px-1 mb-1">
            <input
              type="checkbox"
              checked={selected.size === selectableUsers.length && selectableUsers.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-gray-400">
              {selected.size === selectableUsers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </span>
          </div>
        )}

        {userList.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            No hay usuarios en esta marca todavía.
          </div>
        )}
        {userList.map(u => (
          <div key={u.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 transition-colors ${selected.has(u.id) ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200'}`}>
            {u.role !== 'brand_admin' ? (
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                onChange={() => toggleSelect(u.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer shrink-0"
              />
            ) : (
              <div className="w-4 shrink-0" />
            )}
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{u.name || 'Sin nombre'}</p>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
              {u.establishmentName && (
                <p className="text-xs text-gray-400 mt-0.5">{u.establishmentName}</p>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${roleColors[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
              {BRAND_ROLES.find(r => r.value === u.role)?.label ?? (u.role === 'brand_admin' ? 'Administrador' : u.role)}
            </span>
            {u.role !== 'brand_admin' && (
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" title="Cambiar contraseña"
                  onClick={() => { setPwModal({ userId: u.id, email: u.email }); setNewPassword(''); setPwError(''); setPwSuccess(false) }}>
                  <KeyRound size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Edit2 size={14} /></Button>
                <Button size="sm" variant="ghost" title="Eliminar usuario"
                  onClick={() => { setDeleteConfirm(u); setDeleteError('') }}
                  className="text-gray-300 hover:text-red-500">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {pwModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-1">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500 mb-4">{pwModal.email}</p>
            <Input label="Nueva contraseña *" type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            {pwError && <p className="text-sm text-red-600 mt-2">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600 mt-2">✓ Contraseña actualizada</p>}
            <div className="flex gap-3 mt-4">
              <Button loading={pwLoading} onClick={handleSetPassword}>Guardar</Button>
              <Button variant="secondary" onClick={() => setPwModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Eliminar usuario</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="font-medium text-gray-900 text-sm">{deleteConfirm.name || 'Sin nombre'}</p>
              <p className="text-xs text-gray-500">{deleteConfirm.email}</p>
            </div>
            {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <Button loading={deleteLoading} onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 flex-1">
                Eliminar
              </Button>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Eliminar {selected.size} usuario{selected.size === 1 ? '' : 's'}</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
              {userList.filter(u => selected.has(u.id)).map(u => (
                <p key={u.id} className="text-xs text-gray-600 py-0.5">{u.name || u.email}</p>
              ))}
            </div>
            {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <Button loading={bulkLoading} onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 flex-1">
                Eliminar todos
              </Button>
              <Button variant="secondary" onClick={() => setBulkDeleteConfirm(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
