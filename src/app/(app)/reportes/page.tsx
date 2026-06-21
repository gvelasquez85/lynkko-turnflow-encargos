import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import ReportesPanel from './ReportesPanel'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return <ReportesPanel />
}
