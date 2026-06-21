'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth-client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const setupDone = params.get('setup') === '1'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await signIn.email({
      email:    email.trim(),
      password,
      callbackURL: '/dashboard',
    })

    if (err) {
      const msg = err.message ?? 'Credenciales incorrectas'
      const translations: Record<string, string> = {
        'Password too short': 'La contraseña es muy corta (mínimo 8 caracteres)',
        'Invalid email': 'Correo electrónico inválido',
        'Invalid password': 'Contraseña incorrecta',
        'Email not found': 'No se encontró una cuenta con ese correo',
        'Invalid identifier or credentials': 'Credenciales incorrectas',
        'Account not found': 'No se encontró una cuenta con esas credenciales',
        'Invalid email or password': 'Correo o contraseña incorrectos',
      }
      setError(translations[msg] || msg)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 to-sky-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white">Turnflow</p>
          <p className="text-sky-300 text-sm mt-1">Encargos by Lynkko</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="text-sm text-gray-500 mt-0.5">Accede a tu cuenta de Turnflow</p>
          </div>

          {setupDone && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              ¡Negocio configurado! Inicia sesión para continuar.
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@empresa.com" required autoComplete="email"
              className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Contraseña</label>
              <Link href="/forgot-password" className="text-xs text-sky-600 hover:text-sky-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-10 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 text-gray-900 placeholder:text-gray-400"
              />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-xs text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-sky-600 hover:text-sky-700 font-medium">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
