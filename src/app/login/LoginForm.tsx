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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{ width: '100%', maxWidth: 384 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Turnflow</p>
          <p style={{ fontSize: 14, color: '#7dd3fc', marginTop: 4 }}>Encargos by Lynkko</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: 'var(--space-8)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-5)',
        }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-fg)', margin: 0 }}>Iniciar sesión</h1>
            <p style={{ fontSize: 14, color: 'var(--c-muted-fg)', marginTop: 2 }}>Accede a tu cuenta de Turnflow</p>
          </div>

          {setupDone && (
            <div style={{
              borderRadius: 'var(--radius-lg)', background: 'var(--c-success-bg)',
              border: '1px solid var(--c-success-fg)', padding: 'var(--space-3)',
              fontSize: 14, color: 'var(--c-success-fg)',
            }}>
              ¡Negocio configurado! Inicia sesión para continuar.
            </div>
          )}

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-fg)' }}>Correo electrónico</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@empresa.com" required autoComplete="email"
              style={{
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)',
                padding: 'var(--space-2) var(--space-3)', fontSize: 14,
                background: 'var(--c-surface)', color: 'var(--c-fg)',
                outline: 'none',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-fg)' }}>Contraseña</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--c-primary)', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                style={{
                  width: '100%', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--c-border)', padding: 'var(--space-2) var(--space-3)',
                  paddingRight: 40, fontSize: 14,
                  background: 'var(--c-surface)', color: 'var(--c-fg)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button type="button" onClick={() => setShow(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--c-muted-fg)', cursor: 'pointer',
              }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              borderRadius: 'var(--radius-lg)', background: 'var(--c-destructive-bg)',
              border: '1px solid var(--c-destructive-fg)', padding: 'var(--space-3)',
              fontSize: 14, color: 'var(--c-destructive-fg)',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
            borderRadius: 'var(--radius-lg)', background: 'var(--c-primary)',
            padding: 'var(--space-3)', fontSize: 14, fontWeight: 600,
            color: '#fff', border: 'none', cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}>
            {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-muted-fg)', margin: 0 }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: 'var(--c-primary)', fontWeight: 500, textDecoration: 'none' }}>
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
