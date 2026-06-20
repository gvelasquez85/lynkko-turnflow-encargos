'use client'
import { useState, useEffect, useRef } from 'react'
import { Download, X, Smartphone, ExternalLink } from 'lucide-react'

type Platform = 'ios' | 'android-chrome' | 'desktop-chrome' | 'desktop-edge' | 'desktop-firefox' | 'other'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isFirefox = /Firefox/.test(ua)
  if (isIOS) return 'ios'
  if (isAndroid && isChrome) return 'android-chrome'
  if (isChrome) return 'desktop-chrome'
  if (isEdge) return 'desktop-edge'
  if (isFirefox) return 'desktop-firefox'
  return 'other'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

type StepItem = { text: string; link?: string; linkLabel?: string }
const INSTRUCTIONS: Record<Platform, { title: string; steps: StepItem[] }> = {
  ios: {
    title: 'Instalar en iPhone / iPad',
    steps: [
      { text: 'Toca el botón de Compartir (⬆) en la barra inferior del navegador' },
      { text: 'Busca "Agregar al escritorio" o "Add to Home Screen"' },
      { text: 'Toca "Agregar" en la esquina superior derecha' },
      { text: 'Abre TurnFlow desde el nuevo ícono — se abrirá como app independiente' },
    ],
  },
  'android-chrome': {
    title: 'Instalar en Android (Chrome)',
    steps: [
      { text: 'Toca el menú de tres puntos (⋮) en la esquina superior derecha' },
      { text: 'Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"' },
      { text: 'Toca "Instalar" en el cuadro de diálogo' },
    ],
  },
  'desktop-chrome': {
    title: 'Instalar en Google Chrome',
    steps: [
      { text: 'Busca el ícono de instalación (⊕) en la barra de direcciones' },
      { text: 'Si no lo ves, ve a Menú (⋮) → "Guardar y compartir" → "Instalar TurnFlow..."' },
      { text: 'Haz clic en "Instalar"' },
    ],
  },
  'desktop-edge': {
    title: 'Instalar en Microsoft Edge',
    steps: [
      { text: 'Busca el ícono de instalación (⊕) en la barra de direcciones' },
      { text: 'Si no lo ves, ve a Menú (…) → "Aplicaciones" → "Instalar TurnFlow"' },
      { text: 'Confirma haciendo clic en "Instalar"' },
    ],
  },
  'desktop-firefox': {
    title: 'Instalar en Firefox',
    steps: [
      { text: 'Firefox no soporta PWAs de forma nativa. Usa la extensión "PWAs for Firefox"' },
      { text: 'Instala la extensión desde la tienda de complementos', link: 'https://addons.mozilla.org/en-US/firefox/addon/pwas-for-firefox/', linkLabel: 'Instalar extensión →' },
      { text: 'Alternativa: abre TurnFlow en Chrome o Edge' },
    ],
  },
  other: {
    title: 'Instalar TurnFlow',
    steps: [
      { text: 'Abre esta página en Chrome, Edge o Safari para instalarla como app' },
      { text: 'En Chrome/Edge: busca el ícono de instalación (⊕) en la barra de direcciones' },
      { text: 'En Safari (iOS): toca Compartir (⬆) → "Agregar a pantalla de inicio"' },
    ],
  },
}

const DISMISS_KEY = 'turnflow-pwa-banner-dismissed'

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<Platform>('other')
  const [expanded, setExpanded] = useState(false)
  const deferredPromptRef = useRef<any>(null)
  const [canNativeInstall, setCanNativeInstall] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    try { if (localStorage.getItem(DISMISS_KEY)) return } catch {}
    setPlatform(detectPlatform())
    setVisible(true)
    const handler = (e: Event) => { e.preventDefault(); deferredPromptRef.current = e; setCanNativeInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleNativeInstall() {
    const prompt = deferredPromptRef.current
    if (!prompt) return
    prompt.prompt()
    const result = await prompt.userChoice
    if (result.outcome === 'accepted') {
      setVisible(false)
      try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    }
    deferredPromptRef.current = null
    setCanNativeInstall(false)
  }

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  if (!visible) return null
  const info = INSTRUCTIONS[platform]

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
            <Smartphone size={20} className="text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-900">Instala TurnFlow como app</p>
            <p className="text-xs text-indigo-700 mt-0.5">Accede más rápido desde tu pantalla de inicio, sin abrir el navegador.</p>
          </div>
        </div>
        <button onClick={dismiss} className="p-1 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 shrink-0" title="Descartar">
          <X size={16} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canNativeInstall && (
          <button onClick={handleNativeInstall}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            <Download size={14} /> Instalar ahora
          </button>
        )}
        {!expanded
          ? <button onClick={() => setExpanded(true)} className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              {canNativeInstall ? 'Ver instrucciones manuales' : 'Ver cómo instalar'}
            </button>
          : <button onClick={() => setExpanded(false)} className="inline-flex items-center gap-2 text-xs font-medium text-indigo-500 hover:text-indigo-700">
              Ocultar instrucciones
            </button>
        }
      </div>
      {expanded && (
        <div className="mt-3 bg-white rounded-lg p-4 border border-indigo-100">
          <p className="text-xs font-semibold text-gray-800 mb-3">{info.title}</p>
          <ol className="space-y-2.5">
            {info.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                <div className="text-xs text-gray-600 leading-relaxed">
                  <span>{step.text}</span>
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                      <ExternalLink size={11} /> {step.linkLabel || 'Ver más'}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
