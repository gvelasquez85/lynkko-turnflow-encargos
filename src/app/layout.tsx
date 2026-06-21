import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Turnflow Encargos by Lynkko',
    template: '%s | Turnflow Encargos',
  },
  description: 'Plataforma de gestión de encargos para negocios de sastrería, tintorería, zapatería y más',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body style={{ background: 'var(--c-bg)', color: 'var(--c-fg)', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", margin: 0, WebkitFontSmoothing: 'antialiased' }}>
        {children}
      </body>
    </html>
  )
}
