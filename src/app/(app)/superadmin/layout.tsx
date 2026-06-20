import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string }
  if (user.role !== 'superadmin') redirect('/dashboard')

  return <>{children}</>
}
