import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encargos, customers, encargoServices } from '@/lib/db/schema'
import { eq, desc, isNull, and } from '@lynkko/db'
import { getContext } from '@/lib/context'
import EncargosKanban from './EncargosKanban'

export default async function EncargosPage() {
  const ctx = await getContext()

  const encargosList = await db
    .select({
      id: encargos.id,
      orderCode: encargos.orderCode,
      itemDescription: encargos.itemDescription,
      status: encargos.status,
      price: encargos.price,
      promisedDate: encargos.promisedDate,
      createdAt: encargos.createdAt,
      customerId: encargos.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      serviceName: encargoServices.name,
    })
    .from(encargos)
    .leftJoin(customers, eq(customers.id, encargos.customerId))
    .leftJoin(encargoServices, eq(encargoServices.id, encargos.serviceId))
    .where(eq(encargos.brandId, ctx.brandId))
    .orderBy(desc(encargos.createdAt))

  return <EncargosKanban encargos={encargosList as any} />
}
