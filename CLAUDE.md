# Turnflow Encargos by Lynkko — CLAUDE.md

## Stack

- **Next.js 15** App Router, TypeScript strict, Tailwind CSS v4
- **@lynkko/db** → Drizzle ORM + Neon (NO Supabase)
- **@lynkko/utils** → cn(), formatters, HTTP helpers (ok, badRequest, etc.)
- **@lynkko/email** → Resend
- **@lynkko/push** → Web Push VAPID (reemplaza Firebase FCM)
- **@lynkko/webhooks** → outbound webhooks con HMAC-SHA256
- **@lynkko/wompi** → pagos con tarjeta Colombia
- **better-auth** → autenticación (NO Supabase Auth)

## Modelo multi-tenant

```
brand (tenant principal)
  └── establishment (sucursal)
        └── encargos / tickets / customers / ...
```

- `brand` = empresa/negocio que paga la suscripción
- `establishment` = sucursal bajo un brand
- Los usuarios tienen `brandId` y opcionalmente `establishmentId`
- **Nunca devolver datos sin filtrar por `brandId`**

## Roles

| Rol           | Acceso                                              |
|---------------|-----------------------------------------------------|
| `superadmin`  | Todo — rutas `/superadmin/*`                        |
| `brand_admin` | Su brand completo — rutas `/admin/*`                |
| `manager`     | Su establishment — rutas `/admin/*` restringidas    |
| `advisor`     | Solo su establishment — rutas `/advisor/*`          |
| `reporting`   | Solo lectura de reportes                            |

## Vertical: Encargos

Este repositorio es la **vertical de Encargos** de Turnflow by Lynkko. Gestiona:

- **Servicios de encargo** — Catálogo de servicios (lavandería, zapatería, sastrería, tintorería)
- **Órdenes de encargo** — Registro de prendas/artículos recibidos para arreglo/lavado
- **Items de encargo** — Líneas detalladas dentro de cada orden
- **Notificaciones WhatsApp** — Aviso al cliente cuando su encargo está listo
- **Ventas** — Cobro del servicio al momento de entrega

### Subtipos de negocio
- Lavandería
- Zapatería
- Sastrería
- Tintorería

## Convenciones críticas

### DB — SIN RLS, filtrar siempre en código
```ts
import { eq, and } from '@lynkko/db'
// Siempre filtrar por brandId
.where(and(eq(table.brandId, ctx.brandId), ...))
// Para tablas de establishment, filtrar por establishmentId
.where(eq(table.establishmentId, ctx.establishmentId!))
```

### HTTP responses — usar @lynkko/utils
```ts
import { ok, created, badRequest, unauthorized, forbidden, notFound, serverError } from '@lynkko/utils'
return ok(data)          // 200
return created(item)     // 201
return unauthorized()    // 401
return forbidden()       // 403
```

### Contexto por request
```ts
import { getContext } from '@/lib/context'
// En Route Handlers y Server Actions protegidos:
const ctx = await getContext()
// ctx.userId, ctx.brandId, ctx.establishmentId, ctx.role, ctx.db
```

### Email
```ts
import { email } from '@/lib/email'
await email.send({ to, subject, title, content, ctaText, ctaUrl })
await email.sendOrThrow({ ... })  // lanza si falla (emails críticos)
```

### Push notifications
```ts
import { notifyUser, notifyBrand } from '@/lib/notifications'
await notifyUser(userId, { title, body, url })   // un usuario
await notifyBrand(brandId, { title, body })       // todo el brand
```

## Schema — tablas (`src/lib/db/schema.ts`)

### Core (compartido con todas las verticales)
| Tabla                   | Descripción                                      |
|-------------------------|--------------------------------------------------|
| `users`                 | Better Auth users (+ role, brandId, establishmentId) |
| `sessions/accounts/verifications` | Better Auth internals              |
| `brands`                | Tenant principal (multi-tenant)                  |
| `establishments`        | Sucursales bajo un brand                         |
| `memberships`           | Plan activo + billing (Wompi)                    |
| `customers`             | CRM / Clientes                                   |
| `customerTags`          | Tags de segmentación                             |
| `customerHistory`       | Historial de visitas/compras                     |
| `products`              | Inventario (product/service/digital)             |
| `sales`                 | Ventas y cotizaciones                            |
| `saleItems`             | Líneas de venta                                  |
| `stockMovements`        | Movimientos de inventario                        |
| `tickets`               | Cola de turnos                                   |
| `attentions`            | Atenciones completadas                           |
| `appointments`          | Citas programadas                                |
| `surveyTemplates`       | Plantillas de encuestas                          |
| `surveyResponses`       | Respuestas a encuestas                           |
| `dataConsents`          | Registros de consentimiento GDPR                 |
| `billingTransactions`   | Transacciones de facturación Wompi               |
| `apiKeys`               | Claves API por brand                             |
| `webhookEndpoints`      | Webhooks salientes por brand                     |
| `pushSubscriptions`     | Suscripciones Web Push                           |

### Específicas de Encargos
| Tabla                   | Descripción                                      |
|-------------------------|--------------------------------------------------|
| `encargoServices`       | Catálogo de servicios por brand                  |
| `encargos`              | Órdenes de encargo                               |
| `encargoItems`          | Items/líneas dentro de un encargo                |

## Ramas y deploy

| Rama   | Entorno    | Vercel                          |
|--------|-----------|---------------------------------|
| `main` | Producción | lynkko-turnflow-encargos-prod    |
| `dev`  | Staging    | lynkko-turnflow-encargos-stg     |

**Flujo:** `feature/*` → PR a `dev` → QA en staging → PR a `main` → producción

## DB scripts

```bash
pnpm db:generate   # generar migración nueva
pnpm db:migrate    # aplicar migraciones (usa DATABASE_URL_UNPOOLED)
pnpm db:studio     # Drizzle Studio UI
pnpm db:push       # push directo (solo dev/experimental)
```

## Paquetes @lynkko/*

Publicados en GitHub Packages. `.npmrc` ya configurado.
Para instalar localmente necesitas en `~/.npmrc`:
```
//npm.pkg.github.com/:_authToken=ghp_TU_TOKEN
```

## Notas de arquitectura

- Este repo es una **vertical independiente** del ecosistema Turnflow by Lynkko
- El código compartido (auth, db, billing, CRM, ventas) vive en paquetes `@lynkko/*`
- Las features transversales (comunicaciones, encuestas, PQRS, facturación, contabilidad) son productos separados del ecosistema Lynkko
- Las integraciones entre productos se harán vía webhooks en el futuro

# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- /office-hours
- /plan-ceo-review
- /plan-eng-review
- /plan-design-review
- /design-consultation
- /design-shotgun
- /design-html
- /review
- /ship
- /land-and-deploy
- /canary
- /benchmark
- /browse
- /connect-chrome
- /qa
- /qa-only
- /design-review
- /setup-browser-cookies
- /setup-deploy
- /setup-gbrain
- /retro
- /investigate
- /document-release
- /document-generate
- /codex
- /cso
- /autoplan
- /plan-devex-review
- /devex-review
- /careful
- /freeze
- /guard
- /unfreeze
- /gstack-upgrade
- /learn
