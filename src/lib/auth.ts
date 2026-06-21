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
    sendResetPassword: async ({ user, url }) => {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Turnflow <no-reply@turnflow.co>',
            to: user.email,
            subject: 'Restablece tu contraseña - Turnflow',
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                <h1 style="color: #166534; font-size: 24px; margin-bottom: 16px;">Turnflow</h1>
                <p style="color: #374151; font-size: 16px; line-height: 1.5;">
                  Hola, recibimos una solicitud para restablecer tu contraseña.
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.5;">
                  Haz clic en el botón siguiente para crear una nueva contraseña:
                </p>
                <a href="${url}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #166534; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Restablecer contraseña
                </a>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                  Si no solicitaste este cambio, puedes ignorar este correo.
                </p>
              </div>
            `,
          }),
        })
        if (!res.ok) {
          console.error('[RESET PASSWORD] Resend API error:', await res.text())
        }
      } catch (err) {
        console.error('[RESET PASSWORD] Failed to send email:', err)
      }
    },
  },

  session: {
    expiresIn:  60 * 60 * 24 * 7,
    updateAge:  60 * 60 * 24,
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
    'https://encargos.turnflow.com.co',
    'http://localhost:3000',
  ].filter(Boolean) as string[],
})

export type Session = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.Session.user
