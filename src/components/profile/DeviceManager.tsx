import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

interface Props {
  initialTerraUserId: string | null
  initialLastSync: string | null
  initialProvider: string | null
}

const PROVIDER_ICONS: Record<string, string> = {
  GARMIN: '⌚',
  APPLE: '⌚',
  POLAR: '⌚',
  WHOOP: '⌚',
  OURA: '💍',
  SAMSUNG: '⌚',
  WITHINGS: '⌚',
  SUUNTO: '⌚',
  COROS: '⌚',
}

function formatSync(iso: string | null): string {
  if (!iso) return 'Jamais synchronisé'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Synchronisé à l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${Math.floor(hours / 24)} jour(s)`
}

export default function DeviceManager({ initialTerraUserId, initialLastSync, initialProvider }: Props) {
  const [terraUserId, setTerraUserId] = useState(initialTerraUserId)
  const [lastSync, setLastSync] = useState(initialLastSync)
  const [provider, setProvider] = useState(initialProvider)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/terra/connect', { method: 'POST' })
      if (!res.ok) throw new Error('Erreur de connexion')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setConnecting(false)
    }
  }

  async function disconnect() {
    if (!confirm('Déconnecter cet appareil ? Les synchronisations futures s\'arrêteront.')) return
    setDisconnecting(true)
    setError(null)
    try {
      const sb = getSupabase()
      await sb.from('members').update({ terra_user_id: null, last_sync: null }).eq('id', (await sb.auth.getUser()).data.user!.id)
      setTerraUserId(null)
      setLastSync(null)
      setProvider(null)
    } catch {
      setError('Erreur lors de la déconnexion')
    } finally {
      setDisconnecting(false)
    }
  }

  const SUPPORTED_DEVICES = [
    { label: 'Apple Watch', icon: '⌚' },
    { label: 'Garmin', icon: '⌚' },
    { label: 'Oura Ring', icon: '💍' },
    { label: 'WHOOP', icon: '⌚' },
    { label: 'Polar', icon: '⌚' },
    { label: 'Withings', icon: '⌚' },
  ]

  // ── Appareil connecté ──────────────────────────────────────────────────────
  if (terraUserId) {
    return (
      <div className="flex flex-col gap-4">
        {/* Device connected card */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="label text-gold">Appareil connecté</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-sans text-[10px] text-green-400">Actif</span>
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl">
              {provider ? (PROVIDER_ICONS[provider] ?? '⌚') : '⌚'}
            </div>
            <div>
              <p className="font-sans text-sm font-medium text-t1">{provider ?? 'Appareil'}</p>
              <p className="font-sans text-[10px] text-t4">{formatSync(lastSync)}</p>
            </div>
          </div>

          <div className="h-px bg-white/[0.06] mb-4" />

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Sommeil', icon: '🌙' },
              { label: 'HRV', icon: '💓' },
              { label: 'Activité', icon: '⚡' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.03]">
                <span className="text-lg">{s.icon}</span>
                <span className="font-sans text-[9px] text-t4">{s.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={disconnect}
            disabled={disconnecting}
            className="w-full font-sans text-xs text-red-400/60 hover:text-red-400 transition-colors py-2 disabled:opacity-40"
          >
            {disconnecting ? 'Déconnexion…' : 'Déconnecter l\'appareil'}
          </button>
        </div>

        {error && <p className="font-sans text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  // ── Connexion ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="glass p-5">
        <span className="label block mb-3">Connecter un wearable</span>
        <p className="font-sans text-xs text-t3 leading-relaxed mb-5">
          Synchronisez votre montre ou anneau connecté pour enrichir votre score ORACLE avec des données HRV, sommeil et activité en temps réel.
        </p>

        {/* Devices grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {SUPPORTED_DEVICES.map((d) => (
            <div key={d.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <span className="text-xl">{d.icon}</span>
              <span className="font-sans text-[9px] text-t4 text-center leading-tight">{d.label}</span>
            </div>
          ))}
        </div>

        {error && <p className="font-sans text-xs text-red-400 mb-3">{error}</p>}

        <button
          onClick={connect}
          disabled={connecting}
          className="btn-gold w-full h-11 flex items-center justify-center gap-2 text-[9px] disabled:opacity-50"
        >
          {connecting ? (
            <>
              <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              Connexion…
            </>
          ) : (
            <>
              Connecter un appareil
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </div>

      <div className="glass p-4">
        <p className="label mb-2">Comment ça marche</p>
        <ol className="space-y-2">
          {[
            'Cliquez sur Connecter un appareil',
            'Sélectionnez votre marque de wearable',
            'Autorisez l\'accès à vos données',
            'Vos métriques se synchronisent automatiquement',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-sans text-[8px] text-gold font-medium">{i + 1}</span>
              <span className="font-sans text-xs text-t3 leading-relaxed pt-px">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
