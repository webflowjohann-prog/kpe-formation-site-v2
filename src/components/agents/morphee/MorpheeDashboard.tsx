import { useState } from 'react'
import AgentChat from '../AgentChat'
import type { AgentId } from '@/stores/chat'

const AGENT: AgentId = 'morphee'

interface SleepData {
  sleep_hours: number | null
  sleep_quality: number | null
  morning_freshness: number | null
  bedtime: string | null
  wake_time: string | null
  sleep_issues: string[] | null
}

interface Prescription {
  id: string
  title: string
  description: string | null
  timing: string | null
  duration: string | null
  priority: string
}

interface Props {
  memberId: string
  sleepData: SleepData
  prescriptions: Prescription[]
}

const TABS = ['Chat', 'Analyse', 'Protocole'] as const
type Tab = (typeof TABS)[number]

function sleepLabel(hours: number | null): string {
  if (!hours) return '—'
  if (hours < 6) return 'Insuffisant'
  if (hours < 7) return 'Limite'
  if (hours <= 9) return 'Optimal'
  return 'Excessif'
}

function qualityColor(q: number | null): string {
  if (!q) return 'text-t4'
  if (q >= 7) return 'text-green-400'
  if (q >= 5) return 'text-gold'
  return 'text-red-400'
}

function AnalyseTab({ data }: { data: SleepData }) {
  const { sleep_hours, sleep_quality, morning_freshness, bedtime, wake_time, sleep_issues } = data

  const metrics = [
    {
      label: 'Durée nuit',
      value: sleep_hours ? `${sleep_hours}h` : '—',
      sub: sleepLabel(sleep_hours),
      color: sleep_hours && sleep_hours >= 7 && sleep_hours <= 9 ? 'text-green-400' : 'text-gold',
    },
    {
      label: 'Qualité',
      value: sleep_quality ? `${sleep_quality}/10` : '—',
      sub: sleep_quality ? (sleep_quality >= 7 ? 'Bonne' : sleep_quality >= 5 ? 'Moyenne' : 'Mauvaise') : 'Non évalué',
      color: qualityColor(sleep_quality),
    },
    {
      label: 'Réveil',
      value: morning_freshness ? `${morning_freshness}/10` : '—',
      sub: morning_freshness ? (morning_freshness >= 7 ? 'Reposé' : 'Fatigué') : '—',
      color: qualityColor(morning_freshness),
    },
  ]

  return (
    <div className="px-5 py-4">
      {/* Horaires */}
      {(bedtime || wake_time) && (
        <div className="glass p-5 mb-4">
          <p className="label mb-3">Fenêtre de sommeil déclarée</p>
          <div className="flex gap-6">
            {bedtime && (
              <div>
                <p className="font-sans text-[10px] text-t4 mb-0.5">Coucher</p>
                <p className="font-serif text-xl text-t1">{bedtime}</p>
              </div>
            )}
            {wake_time && (
              <div>
                <p className="font-sans text-[10px] text-t4 mb-0.5">Réveil</p>
                <p className="font-serif text-xl text-t1">{wake_time}</p>
              </div>
            )}
            {bedtime && wake_time && sleep_hours && (
              <div>
                <p className="font-sans text-[10px] text-t4 mb-0.5">Durée</p>
                <p className="font-serif text-xl text-gold">{sleep_hours}h</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="glass p-4 flex flex-col items-center text-center">
            <span className="label mb-2">{m.label}</span>
            <span className={`font-serif text-2xl mb-1 ${m.color}`}>{m.value}</span>
            <span className="font-sans text-[9px] text-t4">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Troubles */}
      {sleep_issues && sleep_issues.length > 0 && !sleep_issues.includes('Aucun trouble particulier') && (
        <div className="glass p-4 mb-4">
          <p className="label mb-2">Troubles identifiés</p>
          <div className="flex flex-wrap gap-2">
            {sleep_issues.map((issue) => (
              <span key={issue} className="px-3 py-1 rounded-full border border-white/[0.08] font-sans text-[10px] text-t3">
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA wearable */}
      <div className="glass p-4 text-center">
        <p className="font-sans text-xs text-t3 mb-3">
          Connectez un wearable pour voir vos cycles NREM/REM en temps réel.
        </p>
        <a href="/app/profile" className="btn-outline h-9 px-4 text-[9px] inline-flex items-center">
          Connecter un wearable
        </a>
      </div>
    </div>
  )
}

function ProtocoleTab({ prescriptions }: { prescriptions: Prescription[] }) {
  if (prescriptions.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="font-sans text-sm text-t3 mb-2">Aucun protocole actif.</p>
        <p className="font-sans text-xs text-t4 mb-6">
          Parlez à MORPHÉE pour recevoir votre routine du soir personnalisée.
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); }} className="btn-outline h-9 px-4 text-[9px] inline-flex items-center">
          Aller au chat
        </a>
      </div>
    )
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <span className="label text-gold">Protocole du soir actif</span>
      {prescriptions.map((p, i) => (
        <div key={p.id} className="glass p-4 flex gap-4 items-start">
          <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="font-sans text-[9px] text-gold font-medium">{i + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-medium text-t1 mb-0.5">{p.title}</p>
            {p.description && <p className="font-sans text-xs text-t3 leading-relaxed">{p.description}</p>}
            <div className="flex gap-3 mt-2">
              {p.timing && <span className="font-sans text-[10px] text-t4">{p.timing}</span>}
              {p.duration && <span className="font-sans text-[10px] text-t4">{p.duration}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MorpheeDashboard({ memberId, sleepData, prescriptions }: Props) {
  const [tab, setTab] = useState<Tab>('Chat')

  return (
    <div>
      <div className="flex gap-0 border-b border-white/[0.06] px-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-3 font-sans text-xs font-medium transition-all border-b-2 -mb-px',
              tab === t ? 'text-gold border-gold' : 'text-t4 border-transparent hover:text-t2',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <AgentChat agent={AGENT} memberId={memberId} />}
      {tab === 'Analyse' && <AnalyseTab data={sleepData} />}
      {tab === 'Protocole' && <ProtocoleTab prescriptions={prescriptions} />}
    </div>
  )
}
