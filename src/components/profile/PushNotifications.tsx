import { useState, useEffect } from 'react'

type PermState = 'default' | 'granted' | 'denied' | 'unsupported'

export default function PushNotifications() {
  const [state, setState] = useState<PermState>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported')
      return
    }
    setState(Notification.permission as PermState)
  }, [])

  async function subscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = import.meta.env.PUBLIC_VAPID_KEY
      if (!vapidKey) throw new Error('VAPID key missing')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })

      setState('granted')
    } catch {
      setState(Notification.permission as PermState)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('default')
    } finally {
      setLoading(false)
    }
  }

  if (state === 'unsupported') return null

  return (
    <div className="glass p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-sans text-sm font-medium text-t2">Notifications push</p>
          <p className="font-sans text-[10px] text-t4 mt-0.5">Daily Brief, alertes biomarqueurs, drops ATLAS</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${state === 'granted' ? 'bg-green-400' : 'bg-t4'}`} />
      </div>

      {state === 'denied' ? (
        <p className="font-sans text-xs text-t4">
          Notifications bloquées. Modifiez les paramètres de votre navigateur pour les activer.
        </p>
      ) : state === 'granted' ? (
        <button
          onClick={unsubscribe}
          disabled={loading}
          className="font-sans text-xs text-t4 hover:text-t2 transition-colors disabled:opacity-50"
        >
          {loading ? 'Désactivation…' : 'Désactiver les notifications'}
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={loading}
          className="btn-outline h-9 w-full text-[10px] disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-t2/30 border-t-t2 rounded-full animate-spin" />
              Activation…
            </span>
          ) : 'Activer les notifications'}
        </button>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
