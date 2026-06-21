import { neon } from '@neondatabase/serverless'

const sql = neon('postgresql://neondb_owner:***@ep-super-hall-ahwjmnmd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')

async function main() {
  // 1. Crear brand de prueba
  const brand = await sql`
    INSERT INTO brands (name, slug, business_type, active, current_plan, active_modules, onboarding_completed)
    VALUES ('Lavandería Don Pepe', 'lavanderia-don-pepe', 'lavanderia', true, 'basic', '{"mensajes":true,"promotions":true}', true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, slug
  `
  console.log('Brand:', brand[0])

  // 2. Crear establishment
  const est = await sql`
    INSERT INTO establishments (brand_id, name, slug, active)
    VALUES (${brand[0].id}, 'Sucursal Centro', 'don-pepe-centro', true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  `
  console.log('Establishment:', est[0])

  // 3. Crear servicios de encargo
  const services = await sql`
    INSERT INTO encargo_services (brand_id, name, description, price, duration_days, is_active, sort_order)
    VALUES 
      (${brand[0].id}, 'Lavado básico', 'Lavado y secado de prendas', 15000, 3, true, 1),
      (${brand[0].id}, 'Planchado', 'Planchado de prendas', 8000, 2, true, 2),
      (${brand[0].id}, 'Lavado de traje', 'Lavado especial para trajes', 25000, 5, true, 3),
      (${brand[0].id}, 'Tintorería', 'Lavado en seco', 30000, 7, true, 4)
    ON CONFLICT DO NOTHING
    RETURNING id, name, price
  `
  console.log('Servicios creados:', services.length)

  // 4. Crear clientes de prueba
  const customers = await sql`
    INSERT INTO customers (brand_id, name, phone, email, active)
    VALUES 
      (${brand[0].id}, 'Juan Pérez', '3001234567', 'juan@mail.com', true),
      (${brand[0].id}, 'María López', '3009876543', 'maria@mail.com', true),
      (${brand[0].id}, 'Carlos Gómez', '3005551234', 'carlos@mail.com', true)
    ON CONFLICT DO NOTHING
    RETURNING id, name
  `
  console.log('Clientes creados:', customers.length)

  // 5. Crear encargos de prueba
  if (customers.length > 0 && services.length > 0) {
    const encargos = await sql`
      INSERT INTO encargos (brand_id, customer_id, order_code, service_id, item_description, status, price, promised_date, notify_whatsapp, customer_name, customer_phone)
      VALUES 
        (${brand[0].id}, ${customers[0].id}, 'ENC-001', ${services[0].id}, 'Camisa de vestir', 'received', 15000, NOW() + INTERVAL '3 days', true, 'Juan Pérez', '3001234567'),
        (${brand[0].id}, ${customers[1].id}, 'ENC-002', ${services[1].id}, 'Pantalón de vestir', 'in_progress', 8000, NOW() + INTERVAL '2 days', true, 'María López', '3009876543'),
        (${brand[0].id}, ${customers[2].id}, 'ENC-003', ${services[2].id}, 'Traje completo', 'ready', 25000, NOW() + INTERVAL '1 day', true, 'Carlos Gómez', '3005551234')
      ON CONFLICT DO NOTHING
      RETURNING id, order_code, status
    `
    console.log('Encargos creados:', encargos.length)
  }

  // 6. Crear usuario admin para este brand
  const user = await sql`
    INSERT INTO users (name, email, email_verified, role, brand_id, establishment_id, active)
    VALUES ('Admin Don Pepe', 'admin@donpepe.com', true, 'brand_admin', ${brand[0].id}, ${est[0].id}, true)
    ON CONFLICT (email) DO UPDATE SET brand_id = EXCLUDED.brand_id, establishment_id = EXCLUDED.establishment_id
    RETURNING id, name, email, role
  `
  console.log('Usuario admin:', user[0])

  console.log('\n✅ Seed completado!')
}

main().catch(console.error)
