import { useState } from 'react'
import AgentChat from '../AgentChat'
import type { AgentId } from '@/stores/chat'

const AGENT: AgentId = 'zenith'

interface MentalData {
  stress_level: number | null
  meditation_frequency: string | null
  mood_general: string | null
  concentration_quality: number | null
  has_breathwork: boolean | null
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
  mentalData: MentalData
  prescriptions: Prescription[]
}

const TABS = ['Chat', 'Sessions', 'Protocoles'] as const
type Tab = (typeof TABS)[number]

const SESSIONS = [
  {
    title: 'Cohérence cardiaque 5-5-5',
    duration: '5 min',
    desc: 'Inspirez 5s — retenez 5s — expirez 5s. Synchronise HRV et système nerveux autonome.',
    icon: '💓',
    tag: 'HRV',
    tagColor: 'text-red-400 border-red-500/20',
  },
  {
    title: 'Box Breathing',
    duration: '4 min',
    desc: '4 temps égaux : inspire — retiens — expire — retiens. Technique des forces spéciales.',
    icon: '🔲',
    tag: 'Stress',
    tagColor: 'text-blue-400 border-blue-500/20',
  },
  {
    title: 'Scan corporel',
    duration: '10 min',
    desc: 'Balayage progressif des sensations. Réduit le cortisol et active le parasympathique.',
    icon: '🧘',
    tag: 'Cortisol',
    tagColor: 'text-gold border-gold/20',
  },
  {
    title: 'NSDR / Yoga Nidra',
    duration: '20 min',
    desc: 'Non-Sleep Deep Rest. Récupération neurale équivalente à 90 min de sommeil lent.',
    icon: '🌙',
    tag: 'Récupération',
    tagColor: 'text-purple-400 border-purple-500/20',
  },
]

function levelColor(n: number | null): string {
  if (!n) return 'text-t4'
  if (n >= 7) return 'text-green-400'
  if (n >= 5) return 'text-gold'
  return 'text-red-400'
}

function stressColor(n: number | null): string {
  if (!n) return 'text-t4'
  if (n <= 3) return 'text-green-400'
  if (n <= 6) return 'text-gold'
  return 'text-red-400'
}

function SessionsTab() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <p className="label">Sessions guidées</p>
      {SESSIONS.map((s) => (
        <div
          key={s.title}
          className={[
            'glass p-4 cursor-pointer transition-all',
            active === s.title ? 'border-gold/30' : '',
          ].join(' ')}
          onClick={() => setActive(active === s.title ? null : s.title)}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-sans text-sm font-medium text-t1">{s.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full border font-sans text-[9px] ${s.tagColor}`}>{s.tag}</span>
                  <span className="font-sans text-[10px] text-t4">{s.duration}</span>
                </div>
              </div>
              {active === s.title && (
                <p className="font-sans text-xs text-t3 leading-relaxed mt-2">{s.desc}</p>
              )}
            </div>
          </div>
          {active === s.title && (
            <button className="mt-3 w-full btn-gold h-9 text-[10px]">
              Démarrer la session
            </button>
          )}
        </div>
      ))}

      <div className="glass p-4 text-center mt-2">
        <p className="font-sans text-xs text-t3 mb-2">
          Demandez à ZÉNITH des sessions personnalisées selon votre HRV du jour.
        </p>
      </div>
    </div>
  )
}

function ProtocolesTab({ data, prescriptions }: { data: MentalData; prescriptions: Prescription[] }) {
  const { stress_level, mood_general, concentration_quality, meditation_frequency, has_breathwork } = data

  const metrics = [
    { label: 'Stress', value: stress_level, colorFn: stressColor, suffix: '/10' },
    { label: 'Concentration', value: concentration_quality, colorFn: levelColor, suffix: '/10' },
  ]

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Métriques */}
      <div className="glass p-5">
        <p className="label mb-4">État mental déclaré</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {metrics.map((m) => (
            <div key={m.label} className="glass p-3 flex flex-col items-center text-center">
              <span className="label text-[8px] mb-1">{m.label}</span>
              <span className={`font-serif text-xl ${m.colorFn(m.value)}`}>
                {m.value ?? '—'}
              </span>
              {m.value && <span className="font-sans text-[9px] text-t4">{m.suffix}</span>}
            </div>
          ))}
        </div>
        {(meditation_frequency || mood_general || has_breathwork !== null) && (
          <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-1.5">
            {mood_general && (
              <div className="flex justify-between">
                <span className="font-sans text-[10px] text-t4">Humeur générale</span>
                <span className="font-sans text-xs text-t2">{mood_general}</span>
              </div>
            )}
            {meditation_frequency && (
              <div className="flex justify-between">
                <span className="font-sans text-[10px] text-t4">Méditation</span>
                <span className="font-sans text-xs text-t2">{meditation_frequency}</span>
              </div>
            )}
            {has_breathwork !== null && (
              <div className="flex justify-between">
                <span className="font-sans text-[10px] text-t4">Breathwork</span>
                <span className="font-sans text-xs text-t2">{has_breathwork ? 'Oui' : 'Non'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Protocoles prescrits */}
      {prescriptions.length > 0 ? (
        <div>
          <p className="label mb-3">Protocoles actifs</p>
          <div className="flex flex-col gap-3">
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
        </div>
      ) : (
        <div className="glass p-4 text-center">
          <p className="font-sans text-xs text-t3 mb-1">Aucun protocole mental actif.</p>
          <p className="font-sans text-xs text-t4">
            Parlez à ZÉNITH pour définir votre routine de gestion du stress.
          </p>
        </div>
      )}

      {/* Info HRV */}
      <div className="glass p-4 border border-gold/10">
        <p className="label mb-2">HRV & cohérence cardiaque</p>
        <p className="font-sans text-xs text-t3 leading-relaxed">
          ZÉNITH utilise votre HRV pour adapter l'intensité des sessions. Connectez un wearable pour des recommandations en temps réel.
        </p>
        <a href="/app/profile" className="inline-flex items-center gap-1.5 mt-3 font-sans text-[10px] text-gold">
          Connecter un wearable
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

export default function ZenithDashboard({ memberId, mentalData, prescriptions }: Props) {
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
      {tab === 'Sessions' && <SessionsTab />}
      {tab === 'Protocoles' && <ProtocolesTab data={mentalData} prescriptions={prescriptions} />}
    </div>
  )
}
