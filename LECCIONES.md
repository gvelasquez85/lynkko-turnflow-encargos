# Lecciones aprendidas — Migración Turnos-App → Lynkko Turnflow

## Contexto
Migración de una app Next.js + Supabase (RLS + Supabase Auth) a la arquitectura
Lynkko Platform: Next.js 15 App Router + Drizzle ORM (`@lynkko/db`) + Better Auth + Vercel.

---

## 1. Arquitectura general

### Principio crítico: NO reescribir, copiar y adaptar
La migración debe copiar los archivos originales y hacer los cambios mínimos necesarios:
- Supabase client → `getContext()` / `db`
- Supabase queries → Drizzle queries
- `supabase.auth.getUser()` → `auth.api.getSession()` o `getContext()`
- RLS → filtros explícitos en código (`WHERE brandId = ?`)

Reescribir desde cero introduce regresiones, comportamientos distintos y pierde meses de trabajo probado en producción.

### Mapeo de rutas
```
turnos-app/src/app/admin/X    →  lynkko-turnflow/src/app/(app)/X
turnos-app/src/app/api/X      →  lynkko-turnflow/src/app/api/X
turnos-app/src/app/superadmin/ →  lynkko-turnflow/src/app/(app)/superadmin/
turnos-app/src/components/X   →  lynkko-turnflow/src/components/X
Rutas públicas (t/, espera/, display/, book/, etc.) → mismo path, fuera del grupo (app)
```

---

## 2. Patrón de auth

### En Route Handlers (API routes)
```typescript
// Rutas protegidas de brand:
import { getContext } from '@/lib/context'
const { userId, brandId, establishmentId, db } = await getContext()
// getContext() lanza error si no hay sesión o no hay brandId → devuelve 401 desde el catch

// Rutas de superadmin:
import { getSuperadminContext } from '@/lib/context'
const { userId, db } = await getSuperadminContext()
```

### En Server Components / Pages
```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const session = await auth.api.getSession({ headers: await headers() })
if (!session?.user) redirect('/login')
const user = session.user as { brandId?: string; role?: string; name: string; id: string }
if (user.brandId) redirect('/dashboard') // en onboarding
```

### Supabase → Better Auth equivalencias
| Supabase | Better Auth / nuevo |
|---|---|
| `createServerSupabaseClient()` | `import { auth } from '@/lib/auth'` |
| `supabase.auth.getUser()` | `auth.api.getSession({ headers: await headers() })` |
| `session.user.id` | `session.user.id` |
| `session.user.user_metadata.brand_id` | `(session.user as any).brandId` |
| RLS policy en DB | filtro explícito `eq(table.brandId, brandId)` |

---

## 3. Patrón de base de datos

### Imports
```typescript
// Operadores: SIEMPRE desde @lynkko/db, NUNCA desde drizzle-orm
import { eq, and, or, desc, asc, ilike, gte, lte, inArray, sql, count, ne } from '@lynkko/db'

// Tablas: desde @/lib/db/schema (NO @/lib/schema)
import { tickets, brands, establishments, users } from '@/lib/db/schema'

// db instance: desde @/lib/db o desde getContext()
import { db } from '@/lib/db'
```

### Patrones de query
```typescript
// SELECT
const rows = await db.select().from(tickets)
  .where(and(eq(tickets.establishmentId, establishmentId), eq(tickets.status, 'waiting')))
  .orderBy(desc(tickets.createdAt))
  .limit(50)

// INSERT con retorno
const [row] = await db.insert(tickets).values({ ... }).returning()

// UPDATE
const [row] = await db.update(tickets)
  .set({ status: 'done' })
  .where(and(eq(tickets.id, id), eq(tickets.establishmentId, establishmentId)))
  .returning()

// DELETE
await db.delete(tickets)
  .where(and(eq(tickets.id, id), eq(tickets.brandId, brandId)))

// COUNT
const [{ total }] = await db.select({ total: count() }).from(tickets).where(...)

// JOIN
const rows = await db
  .select({ ticket: tickets, attention: attentions })
  .from(tickets)
  .leftJoin(attentions, eq(attentions.ticketId, tickets.id))
  .where(eq(tickets.establishmentId, establishmentId))
```

### Tipos numéricos
Las columnas `numeric` en Drizzle se leen como `string` y se escriben como `string`:
```typescript
// INCORRECTO
subtotal: 1500  // ❌ number

// CORRECTO
subtotal: (1500).toFixed(2)  // ✓ "1500.00"
```

### or() puede devolver undefined
```typescript
// INCORRECTO
conditions.push(or(ilike(customers.name, q), ilike(customers.email, q)))

// CORRECTO
const search = or(ilike(customers.name, q), ilike(customers.email, q))
if (search) conditions.push(search)
```

### db.schema no existe
El patrón `db.schema.tableName` no existe. Importar tablas directamente:
```typescript
import { tickets } from '@/lib/db/schema'
// NO: db.schema.tickets
```

---

## 4. Mapeo de tablas (Supabase snake_case → Drizzle camelCase)

| Supabase (string) | Drizzle import | Notas |
|---|---|---|
| `'tickets'` | `tickets` | |
| `'attentions'` | `attentions` | |
| `'appointments'` | `appointments` | |
| `'customers'` | `customers` | |
| `'products'` | `products` | |
| `'sales'` | `sales` | |
| `'sale_items'` | `saleItems` | |
| `'stock_movements'` | `stockMovements` | |
| `'digital_downloads'` | `digitalDownloads` | |
| `'brands'` | `brands` | |
| `'establishments'` | `establishments` | |
| `'users'` | `users` | |
| `'visit_reasons'` | `visitReasons` | |
| `'advisor_fields'` | `advisorFields` | |
| `'display_configs'` | `displayConfigs` | |
| `'survey_templates'` | `surveyTemplates` | |
| `'survey_responses'` | `surveyResponses` | |
| `'menus'` | `menus` | |
| `'menu_categories'` | `menuCategories` | |
| `'menu_items'` | `menuItems` | |
| `'pre_orders'` | `preOrders` | enum sin 'cancelled' |
| `'api_keys'` | `apiKeys` | |
| `'webhook_endpoints'` | `webhookEndpoints` | |
| `'wa_templates'` | `waTemplates` | |
| `'wa_default_templates'` | `waDefaultTemplates` | |
| `'comms_campaigns'` | `commsCampaigns` | |
| `'billing_transactions'` | `billingTransactions` | |
| `'module_subscriptions'` | `moduleSubscriptions` | |
| `'marketplace_modules'` | `marketplaceModules` | |
| `'system_settings'` | `systemSettings` | |
| `'app_translations'` | `appTranslations` | |
| `'promotions'` | `promotions` | |
| `'data_consents'` | `dataConsents` | |
| `'customer_tags'` | `customerTags` | |
| `'customer_history'` | `customerHistory` | |
| `'customer_reminders'` | `customerReminders` | |
| `'push_subscriptions'` | `pushSubscriptions` | |

---

## 5. Middleware

### El middleware NO debe interceptar rutas /api/
Las rutas `/api/` manejan su propia autenticación. Si el middleware aplica el redirect de
onboarding a `/api/` routes, el fetch del cliente recibe HTML 200 (onboarding page), `res.json()`
falla y el cliente cree que tuvo éxito cuando en realidad la API nunca ejecutó.

```typescript
// middleware.ts — condición correcta
if (!user.brandId && user.role !== 'superadmin'
    && !pathname.startsWith('/onboarding')
    && !pathname.startsWith('/api/')) {
  return NextResponse.redirect(new URL('/onboarding', req.url))
}
```

### Public prefixes en middleware
Agregar todas las rutas públicas/cliente final:
```typescript
const PUBLIC_PREFIXES = [
  '/login', '/register', '/forgot-password', '/reset-password', '/onboarding',
  '/book', '/t/', '/display/', '/f/', '/validar', '/cotizacion/', '/pqrs/',
  '/encargo/', '/pedido/', '/order/', '/survey/', '/espera/', '/ayuda',
  '/api/auth', '/api/book', '/api/webhooks', '/api/public', '/api/display',
  '/api/v1',
]
```

---

## 6. Better Auth — configuración crítica

### cookieCache: false (o TTL muy bajo)
Con `cookieCache: enabled: true`, el middleware lee datos de sesión de una cookie con TTL de 5 min.
Si se actualiza `brandId` en la DB directamente (vía Drizzle), el middleware seguirá viendo
`brandId: null` hasta que expire el cache.
**Solución**: `cookieCache: { enabled: false }` para que cada request lea de la DB.

### baseURL obligatorio
Sin `baseURL`, Better Auth deriva el origen del request. En Vercel esto puede causar
inconsistencias en el dominio de las cookies y el error "invalid origin".
```typescript
baseURL: process.env.BETTER_AUTH_URL
  ?? process.env.NEXT_PUBLIC_APP_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
```

### trustedOrigins en Vercel
Vercel genera múltiples URLs por deploy. Incluir todas:
```typescript
trustedOrigins: [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.BETTER_AUTH_URL,
  process.env.VERCEL_URL         ? `https://${process.env.VERCEL_URL}`         : null,
  process.env.VERCEL_BRANCH_URL  ? `https://${process.env.VERCEL_BRANCH_URL}`  : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
  'http://localhost:3000',
].filter(Boolean) as string[]
```

### Variables de entorno requeridas en Vercel
```
BETTER_AUTH_SECRET=<random 32+ chars>
BETTER_AUTH_URL=https://tu-dominio.com   # o NEXT_PUBLIC_APP_URL
DATABASE_URL=postgres://...
```

---

## 7. Errores frecuentes en WebKit/Safari

### "The string did not match the expected pattern."
Este mensaje puede venir de DOS causas distintas:

1. **Regex con bytes raw UTF-8**: Las herramientas Write/Edit embeben bytes `\xcc\x80-\xcd\xaf`
   en lugar de `̀-ͯ`. WebKit rechaza el regex.
   Fix: reemplazar con Python binario después de cada edición del archivo.
   ```python
   with open('route.ts', 'rb') as f: content = f.read()
   content = content.replace(b'[\xcc\x80-\xcd\xaf]', b'[\\u0300-\\u036f]')
   with open('route.ts', 'wb') as f: f.write(content)
   ```

2. **JSON.parse de HTML**: Si una API route sin try-catch lanza error, Next.js devuelve
   HTML 500. `res.json()` en Safari lanza "The string did not match the expected pattern."
   Fix: siempre envolver route handlers en try-catch + verificar `res.ok` antes de `res.json()`.

### Verificar res.ok antes de parsear
```typescript
const res = await fetch('/api/...')
if (!res.ok) {
  const data = await res.json().catch(() => ({}))
  setError(data.error ?? 'Error')
  return
}
const data = await res.json()
```

---

## 8. Enums — valores exactos

Los enums de Drizzle/Postgres son estrictos. Usar solo los valores definidos en el schema:

```typescript
ticketStatus:       'waiting' | 'in_progress' | 'done' | 'cancelled'
appointmentStatus:  'pending' | 'confirmed' | 'cancelled' | 'done' | 'no_show'
preOrderStatus:     'pending' | 'received' | 'preparing' | 'ready' | 'delivered'  // ❌ NO 'cancelled'
plan:               'free' | 'starter' | 'pro' | 'enterprise'
saleType:           'sale' | 'quote'
saleStatus:         'draft' | 'confirmed' | 'invoiced' | 'cancelled'
userRole:           'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting'
```

---

## 9. Slugs únicos
Las columnas `brands.slug` y `establishments.slug` tienen restricción UNIQUE.
Generar siempre con sufijo de timestamp para evitar colisiones en onboarding:
```typescript
function uniqueSlug(base: string) {
  return `${base}-${Date.now().toString(36)}`
}
```

---

## 10. Próximas iteraciones — checklist de inicio de migración

Para cada nueva app que migremos desde Supabase → @lynkko/db:

- [ ] Copiar `src/lib/auth.ts` desde una app ya migrada, ajustar `additionalFields`
- [ ] Copiar `src/lib/context.ts` sin cambios
- [ ] Copiar `src/middleware.ts` y actualizar PUBLIC_PREFIXES
- [ ] Verificar que TODOS los enums del schema coincidan con los valores usados en el código original
- [ ] Reemplazar `import { eq } from 'drizzle-orm'` → `import { eq } from '@lynkko/db'` en masa (sed)
- [ ] Reemplazar `from '@/lib/schema'` → `from '@/lib/db/schema'` en masa (sed)
- [ ] Agregar try-catch a TODOS los route handlers
- [ ] No poner cookieCache enabled en auth hasta que el flujo de onboarding esté probado
- [ ] Setear BETTER_AUTH_URL y NEXT_PUBLIC_APP_URL en Vercel antes del primer deploy
- [ ] Testear onboarding en Safari/WebKit específicamente

---

## 11. Migración de componentes con múltiples sub-queries (ClientesManager)

### Problema: Supabase nested selects vs Drizzle LEFT JOIN
```typescript
// Supabase
await supabase.from('queue_tickets')
  .select('id, visit_reasons(name), establishments(name)')
  .eq('customer_id', id)

// Drizzle — necesita LEFT JOIN explícito
const rows = await db.select({
  id: tickets.id,
  visitReasonName: visitReasons.name,
  establishmentName: establishments.name,
}).from(tickets)
  .leftJoin(visitReasons, eq(tickets.visitReasonId, visitReasons.id))
  .leftJoin(establishments, eq(tickets.establishmentId, establishments.id))
  .where(eq(tickets.customerId, id))
```

### camelCase en customers (todos los campos)
| Supabase (snake_case) | Drizzle (camelCase) |
|---|---|
| `document_id` | `documentId` |
| `canal_contacto` | `canalContacto` |
| `first_visit_at` | `firstVisitAt` |
| `last_visit_at` | `lastVisitAt` |
| `total_visits` | `totalVisits` |
| `establishment_ids` | `establishmentIds` |
| `ultima_compra` | `ultimaCompra` |
| `tag_key` | `tagKey` |
| `tag_label` | ❌ no existe — derivar con `tagKey.replace('custom_', '')` |

### customerTags — sin campo tagLabel
La tabla `customerTags` de Drizzle NO tiene `tagLabel`. Para mostrar el label de una etiqueta custom:
```typescript
// INCORRECTO
tag.tag_label ?? tag.tag_key

// CORRECTO
tag.tagKey.startsWith('custom_')
  ? tag.tagKey.replace('custom_', '')
  : PREDEFINED_TAGS.find(t => t.key === tag.tagKey)?.label ?? tag.tagKey
```

### Rutas de perfil de cliente
```typescript
// turnos-app (viejo)
href={`/admin/clientes/${customer.id}`}

// lynkko-turnflow (nuevo)
href={`/clientes/${customer.id}`}
```

### Tabs eliminados al migrar
- `tratamientos`: Depende de `treatment_records` que no existe en el schema Drizzle.
  Omitir este tab en la migración (solo aplica belleza, no bloquea el negocio).

### page.tsx — datos de contexto en ClientesPanel
El componente panel necesita datos de contexto del servidor que antes venían de Supabase
client-side. Al migrar, el server page.tsx debe hacer las queries de contexto:
```typescript
// page.tsx
const [brand] = await db.select({ name: brands.name, businessType: brands.businessType })
  .from(brands).where(eq(brands.id, brandId)).limit(1)

const estList = await db.select({ id: establishments.id, name: establishments.name })
  .from(establishments).where(and(eq(establishments.brandId, brandId), eq(establishments.active, true)))

const waTemplateList = await db.select({ category: waTemplates.category, body: waTemplates.body })
  .from(waTemplates).where(and(eq(waTemplates.brandId, brandId), eq(waTemplates.isActive, true)))
```

### BulkUploadModal — 100% fetch(), sin Supabase
El componente ya usaba `fetch('/api/admin/bulk-upload', ...)` — solo copiar el componente.
La API route sí necesita migración (Supabase → Drizzle).

### products schema: campos distintos al original
| Supabase | Drizzle |
|---|---|
| `stock_min` | `minStock` |
| `product_type` default `'physical'` | `productType` default `'product'` |
