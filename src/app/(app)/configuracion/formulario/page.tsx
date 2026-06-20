import { redirect } from 'next/navigation'
import { getContext } from '@/lib/context'
import { brands } from '@/lib/db/schema'
import { eq, and, asc } from '@lynkko/db'
import { BrandFormConfigWrapper } from './BrandFormConfigWrapper'

export const dynamic = 'force-dynamic'

export default async function BrandFormConfigPage() {
  const { db, brandId, role } = await getContext()

  if (!['brand_admin', 'manager', 'superadmin'].includes(role)) redirect('/dashboard')

  const brandsQuery = role === 'superadmin'
    ? db.select({ id: brands.id, name: brands.name, formFields: brands.formFields, dataPolicyText: brands.dataPolicyText })
        .from(brands)
        .where(eq(brands.active, true))
        .orderBy(asc(brands.name))
    : db.select({ id: brands.id, name: brands.name, formFields: brands.formFields, dataPolicyText: brands.dataPolicyText })
        .from(brands)
        .where(and(eq(brands.id, brandId), eq(brands.active, true)))

  const brandRows = await brandsQuery

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Formulario del cliente</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configura los campos adicionales y la política de datos que verán tus clientes al registrar su turno</p>
      </div>
      <BrandFormConfigWrapper
        brands={brandRows.map(b => ({
          id: b.id,
          name: b.name,
          formFields: (b.formFields as any[]) || [],
          dataPolicyText: b.dataPolicyText || null,
        }))}
        defaultBrandId={role !== 'superadmin' ? brandId : null}
      />
    </div>
  )
}
