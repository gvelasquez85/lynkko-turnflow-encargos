/**
 * WhatsApp message template definitions for Encargos vertical.
 */

export type WaCategory =
  | 'encargo_listo'
  | 'encargo_recibido'
  | 'encargo_retraso'
  | 'sale_receipt'
  | 'customer_reactivation'

export interface WaTemplateDef {
  category: WaCategory
  name: string
  description: string
  variables: string[]
  defaultBody: string
  icon: string
}

export const WA_TEMPLATE_DEFS: WaTemplateDef[] = [
  {
    category: 'encargo_listo',
    name: 'Encargo listo',
    description: 'Notifica al cliente que su encargo está listo para recibir',
    variables: ['nombre', 'negocio', 'servicio', 'fecha_entrega', 'codigo'],
    defaultBody: `Hola {{nombre}} 👋

Tu encargo en *{{negocio}}* está *listo* para recoger ✅

🧺 *{{servicio}}*
📅 Entrega estimada: {{fecha_entrega}}
🔖 Código: {{codigo}}

¡Te esperamos!`,
    icon: '✅',
  },
  {
    category: 'encargo_recibido',
    name: 'Encargo recibido',
    description: 'Confirmación de recepción del encargo',
    variables: ['nombre', 'negocio', 'servicio', 'fecha_estimada', 'codigo'],
    defaultBody: `Hola {{nombre}} 👋

Hemos recibido tu encargo en *{{negocio}}* 📦

🧺 *{{servicio}}*
📅 Fecha estimada: {{fecha_estimada}}
🔖 Código: {{codigo}}

Te avisaremos cuando esté listo. ¡Gracias!`,
    icon: '📦',
  },
  {
    category: 'encargo_retraso',
    name: 'Aviso de retraso',
    description: 'Notifica un retraso en el encargo',
    variables: ['nombre', 'negocio', 'servivo', 'fecha_nueva'],
    defaultBody: `Hola {{nombre}} 😔

Lamentamos informarte que tu encargo de *{{servicio}}* en *{{negocio}}* tiene un retraso.

📅 Nueva fecha estimada: {{fecha_nueva}}

Disculpa las molestias. ¡Te avisaremos cuando esté listo!`,
    icon: '⏰',
  },
  {
    category: 'sale_receipt',
    name: 'Comprobante de venta',
    description: 'Envía el comprobante de una venta',
    variables: ['nombre', 'negocio', 'total', 'metodo_pago'],
    defaultBody: `Hola {{nombre}} 👋

Gracias por tu compra en *{{negocio}}* 💳

💰 *Total: {{total}}*
💳 Método de pago: {{metodo_pago}}

¡Te esperamos pronto!`,
    icon: '🧾',
  },
  {
    category: 'customer_reactivation',
    name: 'Reactivación de cliente',
    description: 'Mensaje para recuperar clientes inactivos',
    variables: ['nombre', 'negocio'],
    defaultBody: `Hola {{nombre}} 👋

¡Te extrañamos en *{{negocio}}*! 🎉

Tenemos novedades y nos encantaría verte de nuevo. ¿Necesitas algún servicio?

¡Contáctanos!`,
    icon: '💌',
  },
]

export const WA_TEMPLATE_BY_CATEGORY = Object.fromEntries(
  WA_TEMPLATE_DEFS.map(t => [t.category, t])
) as Record<WaCategory, WaTemplateDef>

export function buildWaMessage(
  template: WaTemplateDef,
  variables: Record<string, string>,
): string {
  let body = template.defaultBody
  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return body
}
