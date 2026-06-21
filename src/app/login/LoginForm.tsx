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
      // Translate common Better Auth error messages to Spanish
      const translations: Record<string, string> = {
        'Password too short': 'La contraseña es muy corta (mínimo 8 caracteres)',
        'Invalid email': 'Correo electrónico inválido',
        'Invalid password': 'Contraseña incorrecta',
        'Email not found': 'No se encontró una cuenta con ese correo',
        'Invalid identifier or credentials': 'Credenciales incorrectas',
        'Account not found': 'No se encontró una cuenta con esas credenciales',
      }
      setError(translations[msg] || msg)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white">Turnflow</p>
          <p className="text-indigo-300 text-sm mt-1">by Lynkko</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-5"
        >
          <div>
            <h1 className="text-xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="text-sm text-gray-500 mt-0.5">Accede a tu cuenta de Turnflow</p>
          </div>

          {setupDone && (
            <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              ¡Negocio configurado! Inicia sesión para continuar.
            </p>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              required
              autoComplete="email"
              className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Contraseña</label>
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-xs text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
