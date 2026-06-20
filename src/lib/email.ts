import { sendEmail, sendEmailOrThrow, lynkkoEmailTemplate, type SendEmailOptions } from '@lynkko/email'

const TURNFLOW_COLOR = '#1d4ed8'
const TURNFLOW_FROM  = process.env.RESEND_FROM_EMAIL ?? 'Turnflow <no-reply@turnflow.co>'

interface TurnflowEmailOptions extends Omit<SendEmailOptions, 'from' | 'html'> {
  title:   string
  content: string
  ctaText?: string
  ctaUrl?:  string
}

export function buildEmail(options: TurnflowEmailOptions): SendEmailOptions {
  const { title, content, ctaText, ctaUrl, ...rest } = options
  return {
    ...rest,
    from: TURNFLOW_FROM,
    html: lynkkoEmailTemplate({
      title,
      content,
      primaryColor: TURNFLOW_COLOR,
      footerText:   'Turnflow by Lynkko · Gestión de turnos y citas',
      ctaText,
      ctaUrl,
    }),
  }
}

export const email = {
  send:        (opts: TurnflowEmailOptions) => sendEmail(buildEmail(opts)),
  sendOrThrow: (opts: TurnflowEmailOptions) => sendEmailOrThrow(buildEmail(opts)),
}
