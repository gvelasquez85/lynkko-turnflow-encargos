import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/portal',
  '/api/auth',
  '/api/webhooks',
  '/_next',
  '/favicon.ico',
  '/icons',
  '/sw.js',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // Get all cookies from the request
  const cookies = req.cookies.getAll()
  const sessionCookie = cookies.find(c => 
    c.name === '__Secure-better-auth.session_token' || 
    c.name === 'better-auth.session_token' ||
    c.name.includes('session_token')
  )

  if (!sessionCookie) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Try to get session using the cookie
  try {
    const headers = new Headers()
    headers.set('cookie', `${sessionCookie.name}=${sessionCookie.value}`)
    const session = await auth.api.getSession({ headers })

    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const user = session.user as { active?: boolean; brandId?: string; role?: string }

    if (user.active === false) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'cuenta_inactiva')
      return NextResponse.redirect(url)
    }
    // Onboarding si no tiene brand (excepto superadmin y rutas API de onboarding)
    if (!user.brandId && user.role !== 'superadmin' && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/brand')) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    return NextResponse.next()
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|sw.js|.*\\.png$|.*\\.svg$).*)'],
}
