import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import OnboardingWizard from './OnboardingWizard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configurar negocio — Turnflow' }

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { brandId?: string; name: string }
  if (user.brandId) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white">Turnflow</p>
          <p className="text-indigo-300 text-sm mt-1">by Lynkko</p>
        </div>
        <OnboardingWizard userName={user.name.split(' ')[0]} />
      </div>
    </div>
  )
}
