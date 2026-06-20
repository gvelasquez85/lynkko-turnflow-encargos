# Turnflow by Lynkko

Plataforma de gestión de turnos y citas — parte del ecosistema **Lynkko Platform**.

## Stack

- **Next.js 15** (App Router)
- **@lynkko/db** (Drizzle ORM + Neon)
- **@lynkko/utils** (helpers, HTTP responses)
- **@lynkko/email** (Resend)
- **@lynkko/push** (Web Push VAPID)
- **@lynkko/webhooks** (outbound webhooks)
- **@lynkko/wompi** (pagos Colombia)
- **Better Auth** (autenticación)
- **Tailwind CSS v4**

## Ramas

| Rama  | Entorno     | Vercel                      |
|-------|-------------|----------------------------|
| `main`| Producción  | lynkko-turnflow-prod        |
| `dev` | Staging/QA  | lynkko-turnflow-stg         |

## Flujo de deploy

```
feature/* → dev (stg) → main (prod)
```

Siempre desarrollar en `dev`. Sincronizar a `main` solo cuando el estado en staging es estable.

## Setup local

```bash
# Requisitos: Node 18+, pnpm

# 1. Autenticación con GitHub Packages
# En ~/.npmrc:
# //npm.pkg.github.com/:_authToken=ghp_TU_TOKEN_AQUI

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env.local
# Completar con tus credenciales

# 4. Migraciones
pnpm db:migrate

# 5. Dev server
pnpm dev
```

## Variables de entorno

Ver `.env.example` para la lista completa.

## Migraciones DB

```bash
pnpm db:generate   # generar nueva migración
pnpm db:migrate    # aplicar migraciones
pnpm db:studio     # Drizzle Studio (UI)
```
