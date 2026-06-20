import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { encargos, brands, systemSettings } from '@/lib/db/schema'
import { eq, inArray } from '@lynkko/db'

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export async function POST(req: NextRequest) {
  const { brandId } = await getContext()

  const body = await req.json().catch(() => null)
  const { encargoId, customerEmail, customerName, itemDescription, orderCode, total, portalUrl } = body ?? {}

  if (!encargoId || !customerEmail) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const [encargo] = await db
    .select({ id: encargos.id, brandId: encargos.brandId })
    .from(encargos)
    .where(eq(encargos.id, encargoId))
    .limit(1)

  if (!encargo || encargo.brandId !== brandId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const [brand] = await db
    .select({ name: brands.name, logoUrl: brands.logoUrl, primaryColor: brands.primaryColor })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1)

  try {
    const settings = await db
      .select({ key: systemSettings.key, value: systemSettings.value })
      .from(systemSettings)
      .where(inArray(systemSettings.key, ['BREVO_API_KEY', 'COMMS_FROM_EMAIL', 'COMMS_FROM_NAME']))

    const cfg = Object.fromEntries(settings.map(r => [r.key, r.value]))
    const brevoKey  = (cfg['BREVO_API_KEY']    || process.env.BREVO_API_KEY    || '').trim()
    const fromEmail = (cfg['COMMS_FROM_EMAIL']  || process.env.COMMS_FROM_EMAIL || '').trim()
    const fromName  = (cfg['COMMS_FROM_NAME']   || process.env.COMMS_FROM_NAME  || brand?.name || 'TurnFlow').trim()
    const brandName  = brand?.name ?? fromName
    const brandColor = (brand as any)?.primaryColor || '#F59E0B'
    const logoUrl    = brand?.logoUrl || ''

    if (!brevoKey || !fromEmail) {
      return NextResponse.json({ ok: true, emailSent: false, reason: 'No Brevo config' })
    }

    const htmlContent = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
<div style="max-width:540px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:${brandColor};padding:24px 32px;">
    ${logoUrl ? `<img src="${logoUrl}" style="height:32px;object-fit:contain;margin-bottom:8px;" alt="Logo" /><br/>` : ''}
    <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;">Tu encargo está listo</p>
    <h1 style="margin:4px 0 0;color:#fff;font-size:24px;font-weight:800;">✅ ¡Listo para recoger!</h1>
  </div>
  <div style="padding:28px 32px;">
    <p style="color:#374151;font-size:15px;">Hola <strong>${customerName}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;">
      Tu encargo en <strong>${brandName}</strong> ya está listo para recoger. ¡Te esperamos!
    </p>
    <div style="margin:20px 0;padding:20px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
      <p style="margin:0 0 8px;font-size:13px;color:#78350f;">
        <strong>📦 Artículo:</strong> ${itemDescription}
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#78350f;">
        <strong>🔖 Código:</strong> <span style="font-family:monospace;font-weight:700;">${orderCode}</span>
      </p>
      <p style="margin:0;font-size:13px;color:#78350f;">
        <strong>💰 Total:</strong> ${fmtCOP(Number(total) || 0)}
      </p>
    </div>
    ${portalUrl ? `
    <div style="text-align:center;margin:24px 0;">
      <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:${brandColor};color:#fff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">
        Ver seguimiento del encargo
      </a>
    </div>` : ''}
    <p style="color:#9ca3af;font-size:12px;">Si tienes alguna pregunta, puedes responder a este correo o contactarnos directamente.</p>
  </div>
  <div style="background:#f9fafb;padding:14px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">${brandName} · Powered by TurnFlow</p>
  </div>
</div>
</body></html>`

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: customerEmail, name: customerName }],
        subject: `✅ Tu encargo está listo — ${brandName}`,
        htmlContent,
      }),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('[encargos/notify-ready] Brevo error:', res.status, txt)
      return NextResponse.json({ ok: true, emailSent: false, reason: 'Brevo API error' })
    }
  } catch (err) {
    console.error('[encargos/notify-ready] exception:', err)
    return NextResponse.json({ ok: true, emailSent: false, reason: 'exception' })
  }

  return NextResponse.json({ ok: true, emailSent: true })
}
