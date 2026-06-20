import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brands, memberships, users } from '@/lib/db/schema'
import { eq, desc, count } from '@lynkko/db'
import SuperadminPanel from './SuperadminPanel'

export default async function SuperadminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const user = session.user as { role?: string }
  if (user.role !== 'superadmin') redirect('/dashboard')

  // Fetch all brands with their membership info
  const brandsList = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      active: brands.active,
      currentPlan: brands.currentPlan,
      businessType: brands.businessType,
      createdAt: brands.createdAt,
      onboardingCompleted: brands.onboardingCompleted,
    })
    .from(brands)
    .orderBy(desc(brands.createdAt))

  // Fetch member count per brand
  const memberCounts = await db
    .select({ brandId: users.brandId, count: count() })
    .from(users)
    .where(eq(users.active, true))
    .groupBy(users.brandId)

  const memberCountMap = new Map(memberCounts.map(m => [m.brandId, m.count]))

  const brandsWithCounts = brandsList.map(b => ({
    ...b,
    memberCount: memberCountMap.get(b.id) ?? 0,
  }))

  return (
    <SuperadminPanel brands={brandsWithCounts as any} />
  )
}
