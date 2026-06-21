import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encargoServices } from '@/lib/db/schema'
import { eq, asc } from '@lynkko/db'
import { getContext } from '@/lib/context'
import ServicesManager from './ServicesManager'

export default async function ServiciosPage() {
  const ctx = await getContext()

  const services = await db
    .select()
    .from(encargoServices)
    .where(eq(encargoServices.brandId, ctx.brandId))
    .orderBy(asc(encargoServices.sortOrder))

  return <ServicesManager services={services} />
}
