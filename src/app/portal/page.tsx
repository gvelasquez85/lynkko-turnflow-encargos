import { db } from '@/lib/db'
import { encargos, customers, encargoServices, brands } from '@/lib/db/schema'
import { eq, and, isNotNull } from '@lynkko/db'
import ClientPortal from './ClientPortal'

export const dynamic = 'force-dynamic'

export default async function ClientPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; doc?: string }>
}) {
  const { code, doc } = await searchParams

  if (!code || !doc) {
    return <ClientPortal encargo={null} error={null} />
  }

  // Find encargo by code + customer document
  // innerJoin enforces that the customer document matches
  const [encargoData] = await db
    .select({
      id: encargos.id,
      orderCode: encargos.orderCode,
      itemDescription: encargos.itemDescription,
      status: encargos.status,
      price: encargos.price,
      promisedDate: encargos.promisedDate,
      createdAt: encargos.createdAt,
      readyAt: encargos.readyAt,
      deliveredAt: encargos.deliveredAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      serviceName: encargoServices.name,
      brandName: brands.name,
      brandAddress: brands.address,
    })
    .from(encargos)
    .innerJoin(customers, and(
      eq(customers.id, encargos.customerId),
      eq(customers.documentId, doc),
      isNotNull(customers.documentId),
    ))
    .leftJoin(encargoServices, eq(encargoServices.id, encargos.serviceId))
    .leftJoin(brands, eq(brands.id, encargos.brandId))
    .where(eq(encargos.orderCode, code))
    .limit(1)

  if (!encargoData) {
    return <ClientPortal encargo={null} error="No se encontró un encargo con ese código y documento. Verifica los datos e intenta de nuevo." />
  }

  return <ClientPortal encargo={encargoData as any} error={null} />
}
