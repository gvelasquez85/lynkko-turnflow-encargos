'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, MapPin, ChevronRight, Loader2, Check, Shield } from 'lucide-react'

interface OnboardingWizardProps {
  userName?: string | null
}

const BUSINESS_TYPES = [
  { key: 'lavanderia', label: 'Lavandería', icon: '🧺', description: 'Lavado, secado y planchado de prendas' },
  { key: 'zapateria', label: 'Zapatería', icon: '👞', description: 'Reparación y restauración de calzado' },
  { key: 'sastreria', label: 'Sastrería', icon: '✂️', description: 'Ajustes, arreglos y confección de prendas' },
  { key: 'tintoreria', label: 'Tintorería', icon: '👔', description: 'Lavado en seco y tratamientos especiales' },
]

export default function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [businessType, setBusinessType] = useState('lavanderia')
  const [address, setAddress] = useState('')
  const [dataConsent, setDataConsent] = useState(false)

  const firstName = userName?.split(' ')[0] || 'Usuario'

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function handleNameChange(value: string) {
    setName(value)
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !slug.trim()) {
      setError('Por favor completa todos los campos')
      return
    }
    if (!dataConsent) {
      setError('Debes aceptar el tratamiento de datos personales para continuar')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          businessType,
          address: address.trim(),
          dataConsent,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear el negocio')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white">Turnflow</p>
          <p className="text-indigo-300 text-sm mt-1">by Lynkko</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Progress */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          </div>

          {/* Step 1: Nombre y tipo de negocio */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hola, {firstName} 👋</h1>
                <p className="text-sm text-gray-500 mt-1">Cuéntanos sobre tu negocio para comenzar</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Nombre del negocio</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ej: Lavandería Don Pepe"
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Slug (identificador único)</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">turnflow.co/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tipo de negocio</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setBusinessType(type.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        businessType === type.key
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{type.label}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={() => name.trim() && slug.trim() ? setStep(2) : setError('Completa el nombre y slug')}
                disabled={!name.trim() || !slug.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Continuar <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Dirección */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">¿Dónde está tu negocio?</h1>
                <p className="text-sm text-gray-500 mt-1">Esta dirección se mostrará a tus clientes</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Dirección</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ej: Calle 123 #45-67, Bogotá"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Continuar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Consentimiento de datos */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tratamiento de datos personales</h1>
                <p className="text-sm text-gray-500 mt-1">Necesitamos tu consentimiento para procesar datos</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Política de tratamiento de datos</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Para utilizar Turnflow, necesitamos tu consentimiento para recolectar y procesar datos personales
                      de tus clientes (nombre, teléfono, email). Estos datos se usarán exclusivamente para gestionar
                      tus encargos y comunicarte con tus clientes.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={dataConsent}
                  onChange={e => setDataConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Acepto el tratamiento de datos personales</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Entiendo que se enviará un correo electrónico a mis clientes para que acepten el tratamiento de datos
                    antes de ser incluidos en la plataforma.
                  </p>
                </div>
              </label>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !dataConsent}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Crear mi negocio'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
