'use client'
import { useState, useCallback } from 'react'

export type PushPermission = 'default' | 'granted' | 'denied'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>(
    typeof Notification !== 'undefined' ? (Notification.permission as PushPermission) : 'default'
  )
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const requestAndGetToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setLastError('Este navegador no soporta notificaciones')
      return null
    }
    setLoading(true)
    setLastError(null)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)
      if (perm !== 'granted') {
        setLastError(perm === 'denied'
          ? 'Permiso denegado. Habilítalo en la configuración del navegador.'
          : 'No se otorgó permiso de notificaciones')
        return null
      }

      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setLastError('VAPID key no configurada')
        return null
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      return JSON.stringify(subscription)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Push] Error:', msg)
      setLastError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { permission, loading, requestAndGetToken, lastError }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
