'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface Establishment {
  id: string
  name: string
  slug: string
  address: string | null
}

export function EstablishmentForm({ initial }: { initial: Establishment | null }) {
  const [name, setName]       = useState(initial?.name ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setError(null)

    const res = await fetch('/api/admin/establishment', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Nombre de la sucursal</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Slug</label>
        <input
          type="text"
          value={initial?.slug ?? ''}
          disabled
          className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500"
        />
        <p className="text-xs text-gray-400">URL pública: /t/{initial?.slug}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Dirección</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Calle 123 # 45-67, Bogotá"
          className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">Cambios guardados</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
