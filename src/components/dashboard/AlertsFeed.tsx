import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

export interface AlertData {
  id: string
  agent: string
  title: string
  message: string | null
  severity: 'info' | 'warning' | 'critical'
  read: boolean
  created_at: string
}

interface Props {
  alerts: AlertData[]
}

const SEVERITY_STYLES: Record<string, string> = {
  info: 'border-white/[0.08] bg-white/[0.02]',
  warning: 'border-[#c9a96e]/30 bg-[#c9a96e]/[0.05]',
  critical: 'border-red-500/30 bg-red-500/[0.05]',
}

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-t4',
  warning: 'bg-gold',
  critical: 'bg-red-400',
}

export default function AlertsFeed({ alerts }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  if (alerts.length === 0) return null

  const visible = alerts.filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  async function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]))
    const sb = getSupabase()
    await sb.from('agent_alerts').update({ read: true }).eq('id', id)
  }

  return (
    <section className="px-5 pt-6">
      <span className="label text-gold block mb-3">Alertes agents</span>
      <div className="flex flex-col gap-2">
        {visible.map((alert) => (
          <div
            key={alert.id}
            className={[
              'flex items-start gap-3 p-4 rounded-[16px] border',
              SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info,
            ].join(' ')}
          >
            <span
              className={[
                'flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5',
                SEVERITY_DOT[alert.severity] ?? SEVERITY_DOT.info,
              ].join(' ')}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="label text-gold">{alert.agent}</span>
              </div>
              <p className="font-sans text-xs text-t2 font-medium leading-snug">{alert.title}</p>
              {alert.message && (
                <p className="font-sans text-xs text-t3 leading-relaxed mt-1">{alert.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              className="flex-shrink-0 text-t4 hover:text-t2 transition-colors"
              aria-label="Ignorer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
