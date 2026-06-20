import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user:         schema.users,
      session:      schema.sessions,
      account:      schema.accounts,
      verification: schema.verifications,
    },
  }),

  user: {
    additionalFields: {
      role: {
        type:     'string',
        required: false,
        defaultValue: 'brand_admin',
        input:    true,
      },
      brandId: {
        type:     'string',
        required: false,
        input:    false,
      },
      establishmentId: {
        type:     'string',
        required: false,
        input:    false,
      },
      active: {
        type:         'boolean',
        required:     false,
        defaultValue: true,
        input:        false,
      },
    },
  },

  emailAndPassword: {
    enabled:          true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn:  60 * 60 * 24 * 7,  // 7 días
    updateAge:  60 * 60 * 24,       // renovar si queda menos de 1 día
    cookieCache: {
      enabled: false,
    },
  },

  cookies: {
    sessionToken: {
      name: 'better-auth.session_token',
      attributes: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL         ? `https://${process.env.VERCEL_URL}`         : null,
    process.env.VERCEL_BRANCH_URL  ? `https://${process.env.VERCEL_BRANCH_URL}`  : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    'http://localhost:3000',
  ].filter(Boolean) as string[],
})

export type Session = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.Session.user
