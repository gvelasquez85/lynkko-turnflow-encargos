const { neon } = require('@neondatabase/serverless')
const { readFileSync } = require('fs')

const config = JSON.parse(readFileSync('.db-config.json', 'utf8'))
const sql = neon(config.dbUrl)

async function main() {
  try {
    // Verificar datos existentes
    const brands = await sql`SELECT id, name, slug FROM brands`
    console.log('Brands:', brands.length)
    brands.forEach(b => console.log(`  ${b.id} | ${b.name} (${b.slug})`))

    const customers = await sql`SELECT id, name, brand_id FROM customers`
    console.log('Customers:', customers.length)
    customers.forEach(c => console.log(`  ${c.id} | ${c.name}`))

    const services = await sql`SELECT id, name, brand_id FROM encargo_services`
    console.log('Services:', services.length)
    services.forEach(s => console.log(`  ${s.id} | ${s.name}`))

    const encargos = await sql`SELECT id, order_code, status, brand_id FROM encargos`
    console.log('Encargos:', encargos.length)
    encargos.forEach(e => console.log(`  ${e.id} | ${e.order_code} (${e.status})`))

    // Crear encargos de prueba si no existen
    if (encargos.length === 0 && customers.length > 0 && services.length > 0) {
      console.log('\nCreando encargos de prueba...')
      const brandId = brands[0].id
      const newEncargos = await sql`
        INSERT INTO encargos (brand_id, customer_id, order_code, service_id, item_description, status, price, promised_date, notify_whatsapp, advisor_id)
        VALUES 
          (${brandId}, ${customers[0].id}, 'ENC-001', ${services[0].id}, 'Camisa de vestir', 'received', 15000, NOW() + INTERVAL '3 days', true, null),
          (${brandId}, ${customers[1]?.id || customers[0].id}, 'ENC-002', ${services[1]?.id || services[0].id}, 'Pantalón de vestir', 'in_progress', 8000, NOW() + INTERVAL '2 days', true, null)
        RETURNING id, order_code, status
      `
      console.log('Encargos creados:', newEncargos.length)
      newEncargos.forEach(e => console.log(`  ${e.order_code} (${e.status})`))
    }

    console.log('\n✅ Seed completado!')
  } catch (err) {
    console.error('Error:', err.message)
  }
}

main()
