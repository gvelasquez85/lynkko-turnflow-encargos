import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Rutas accesibles sin autenticación
const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  // Rutas públicas de la app (clientes finales)
  '/book',           // reserva de cita pública
  '/t/',             // pantalla de turno del cliente (confirmación)
  '/display/',       // pantalla TV por establecimiento
  '/f/',             // formulario público (encargo, pre-checkin)
  '/validar',        // validación de documentos
  '/cotizacion/',    // vista pública de cotización
  // APIs públicas
  '/api/auth',
  '/api/book',
  '/api/webhooks',
  '/api/public',
  '/api/display',
  '/api/debug',   // temporal — diagnóstico
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const session = await auth.api.getSession({ headers: req.headers })

  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const user = session.user as { active?: boolean; brandId?: string; role?: string }

  // Bloquear usuarios inactivos
  if (user.active === false) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'cuenta_inactiva')
    return NextResponse.redirect(url)
  }

  // Onboarding si no tiene brand (excepto superadmin y rutas API — esas manejan su propia auth)
  if (!user.brandId && user.role !== 'superadmin' && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|sw.js|.*\\.png$|.*\\.svg$).*)'],
}
