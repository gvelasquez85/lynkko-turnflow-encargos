'use client'

import { useState } from 'react'
import { Building2, MapPin, ChevronRight, Loader2 } from 'lucide-react'

const BUSINESS_TYPES = [
  { value: 'banco',          label: 'Banco / Financiero' },
  { value: 'clinica',        label: 'Clínica / Salud' },
  { value: 'gobierno',       label: 'Entidad de gobierno' },
  { value: 'retail',         label: 'Tienda / Retail' },
  { value: 'restaurante',    label: 'Restaurante' },
  { value: 'concesionario',  label: 'Concesionario' },
  { value: 'telecomunicaciones', label: 'Telecomunicaciones' },
  { value: 'otros',          label: 'Otro' },
]

interface Props { userName: string }

export function OnboardingWizard({ userName }: Props) {
  const [step, setStep]               = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [brandName, setBrandName]     = useState('')
  const [businessType, setBusinessType] = useState('otros')
  const [estabName, setEstabName]     = useState('')
  const [address, setAddress]         = useState('')

  function generateSlug(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleFinish() {
    setLoading(true)
    setError(null)
    try {
      const slug = generateSlug(brandName)
      const res = await fetch('/api/admin/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandName,
          slug,
          businessType,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Error al crear el negocio')
        setLoading(false)
        return
      }

      window.location.href = '/dashboard'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2].map(n => (
          <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hola, {userName} 👋</h1>
            <p className="text-sm text-gray-500 mt-1">Cuéntanos sobre tu negocio para comenzar</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nombre del negocio</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="Ej: Banco Nacional, Clínica Vida..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tipo de negocio</label>
            <select
              value={businessType}
              onChange={e => setBusinessType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              {BUSINESS_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { if (brandName.trim()) setStep(2) }}
            disabled={!brandName.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Continuar <ChevronRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Primera sucursal</h1>
            <p className="text-sm text-gray-500 mt-1">Dónde estarás atendiendo a tus clientes</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nombre de la sucursal</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={estabName}
                onChange={e => setEstabName(e.target.value)}
                placeholder="Ej: Sede Principal, Sucursal Norte..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Dirección <span className="text-gray-400">(opcional)</span></label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Calle 123 # 45-67, Bogotá"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Atrás
            </button>
            <button
              onClick={handleFinish}
              disabled={!estabName.trim() || loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Configurando...' : 'Comenzar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
