import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brands, establishments } from '@/lib/db/schema'
import { eq, and } from '@lynkko/db'
import AppShell from '@/components/layout/AppShell'
import type { AppRole } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as {
    id: string
    name: string
    email: string
    role?: string
    brandId?: string
    establishmentId?: string
  }

  const role = (user.role ?? 'advisor') as AppRole
  const brandId = user.brandId

  let brandName: string | null = null
  let activeModules: Record<string, boolean> = {}
  let plan: string = 'free'
  let establishmentName: string | null = null
  let establishmentSlug: string | null = null

  if (brandId) {
    const [brandRow] = await db
      .select({
        name:          brands.name,
        currentPlan:   brands.currentPlan,
        activeModules: brands.activeModules,
      })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1)

    if (brandRow) {
      brandName     = brandRow.name
      plan          = brandRow.currentPlan
      activeModules = (brandRow.activeModules as Record<string, boolean>) ?? {}
    }

    if (user.establishmentId) {
      const [estRow] = await db
        .select({ name: establishments.name, slug: establishments.slug })
        .from(establishments)
        .where(and(eq(establishments.id, user.establishmentId), eq(establishments.brandId, brandId)))
        .limit(1)

      if (estRow) {
        establishmentName = estRow.name
        establishmentSlug = estRow.slug
      }
    }
  }

  return (
    <AppShell
      role={role}
      fullName={user.name}
      email={user.email}
      brandName={brandName}
      establishmentName={establishmentName}
      establishmentSlug={establishmentSlug}
      activeModules={activeModules}
      plan={plan}
    >
      {children}
    </AppShell>
  )
}
