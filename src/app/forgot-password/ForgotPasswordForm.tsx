'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Loader2, MailCheck } from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await authClient.requestPasswordReset({
      email:       email.trim(),
      redirectTo:  `${window.location.origin}/reset-password`,
    })

    if (err) {
      setError(err.message ?? 'No se pudo enviar el correo')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white">Turnflow</p>
          <p className="text-indigo-300 text-sm mt-1">by Lynkko</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MailCheck size={32} className="text-green-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Revisa tu correo</p>
                <p className="text-sm text-gray-500 mt-1">
                  Enviamos un enlace de recuperación a <strong>{email}</strong>
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Recuperar contraseña</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Te enviamos un enlace para restablecer tu contraseña
                </p>
              </div>

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
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>

              <p className="text-center text-xs text-gray-500">
                <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Volver al inicio de sesión
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
