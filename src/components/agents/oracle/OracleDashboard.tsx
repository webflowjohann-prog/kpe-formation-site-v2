import { useState } from 'react'
import AgentChat from '../AgentChat'
import type { AgentId } from '@/stores/chat'
import { BiomarkerPill } from '@/components/ui/BiomarkerPill'
import type { BiomarkerStatus } from '@/components/ui/BiomarkerPill'
import { MiniBar } from '@/components/ui/MiniBar'

const AGENT: AgentId = 'oracle'

interface BiomarkerResult {
  id: string
  biomarker_id: string | null
  value: number
  unit: string | null
  measured_at: string
  name: string
  category: string
  normal_min: number | null
  normal_max: number | null
  optimal_min: number | null
  optimal_max: number | null
}

interface ScoreHistory {
  calculated_at: string
  score: number
  sleep_score: number | null
  recovery_score: number | null
  activity_score: number | null
  biomarker_score: number | null
  compliance_score: number | null
}

interface DailyBrief {
  id: string
  content: string
  created_at: string
}

interface Props {
  memberId: string
  biomarkers: BiomarkerResult[]
  scoreHistory: ScoreHistory[]
  dailyBrief: DailyBrief | null
  currentScore: number
}

const TABS = ['Chat', 'Biomarqueurs', 'Rapports'] as const
type Tab = (typeof TABS)[number]

const CATEGORY_LABELS: Record<string, string> = {
  vitamin: 'Vitamines',
  mineral: 'Minéraux',
  lipid: 'Lipides',
  hormone: 'Hormones',
  metabolic: 'Métabolique',
  inflammation: 'Inflammation',
  renal: 'Rénal',
  blood: 'Hématologie',
}

function getStatus(b: BiomarkerResult): BiomarkerStatus {
  const { value, optimal_min, optimal_max, normal_min, normal_max } = b
  if (optimal_min !== null && optimal_max !== null && value >= optimal_min && value <= optimal_max) return 'optimal'
  if (normal_min !== null && normal_max !== null && value >= normal_min && value <= normal_max) return 'unknown'
  if (normal_min !== null && value < normal_min) return 'low'
  if (normal_max !== null && value > normal_max) return 'high'
  return 'unknown'
}

function statusLabel(s: BiomarkerStatus): string {
  if (s === 'optimal') return 'Optimal'
  if (s === 'low') return 'Bas'
  if (s === 'high') return 'Élevé'
  return 'Normal'
}

function statusColor(s: BiomarkerStatus): string {
  if (s === 'optimal') return 'text-gold'
  if (s === 'low') return 'text-blue-400'
  if (s === 'high') return 'text-red-400'
  return 'text-t3'
}

function BiomarkerDetail({ b, onClose }: { b: BiomarkerResult; onClose: () => void }) {
  const status = getStatus(b)

  function rangePercent(): number {
    const lo = b.normal_min ?? 0
    const hi = b.normal_max ?? b.value * 2
    return Math.min(100, Math.max(0, ((b.value - lo) / (hi - lo)) * 100))
  }

  return (
    <div className="glass p-5 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-sans text-sm font-semibold text-t1">{b.name}</h3>
          <p className="font-sans text-[10px] text-t4 mt-0.5">{CATEGORY_LABELS[b.category] ?? b.category}</p>
        </div>
        <button onClick={onClose} className="text-t4 hover:text-t2 transition-colors p-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Valeur principale */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className={`font-serif text-4xl ${statusColor(status)}`}>{b.value}</span>
        {b.unit && <span className="font-sans text-sm text-t4">{b.unit}</span>}
        <span className={`ml-auto font-sans text-xs font-medium ${statusColor(status)}`}>{statusLabel(status)}</span>
      </div>

      {/* Barre de position */}
      {(b.normal_min !== null || b.normal_max !== null) && (
        <div className="mb-4">
          <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
            {/* Zone normale */}
            {b.normal_min !== null && b.normal_max !== null && (
              <div
                className="absolute top-0 h-full bg-white/[0.08] rounded-full"
                style={{
                  left: '15%',
                  right: '15%',
                }}
              />
            )}
            {/* Zone optimale */}
            {b.optimal_min !== null && b.optimal_max !== null && b.normal_max !== null && b.normal_min !== null && (
              <div
                className="absolute top-0 h-full bg-gold/30 rounded-full"
                style={{
                  left: `${((b.optimal_min - b.normal_min) / (b.normal_max - b.normal_min)) * 70 + 15}%`,
                  right: `${100 - ((b.optimal_max - b.normal_min) / (b.normal_max - b.normal_min)) * 70 - 15}%`,
                }}
              />
            )}
            {/* Curseur valeur */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-bg ${status === 'optimal' ? 'bg-gold' : status === 'low' || status === 'high' ? 'bg-red-400' : 'bg-white'}`}
              style={{ left: `calc(${rangePercent()}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-sans text-[9px] text-t4">Bas</span>
            <span className="font-sans text-[9px] text-gold">Zone optimale</span>
            <span className="font-sans text-[9px] text-t4">Élevé</span>
          </div>
        </div>
      )}

      {/* Références */}
      <div className="grid grid-cols-2 gap-2">
        {b.normal_min !== null && b.normal_max !== null && (
          <div className="glass p-2 text-center">
            <p className="font-sans text-[9px] text-t4 mb-0.5">Plage normale</p>
            <p className="font-sans text-xs text-t2">{b.normal_min} – {b.normal_max} {b.unit}</p>
          </div>
        )}
        {b.optimal_min !== null && b.optimal_max !== null && (
          <div className="glass p-2 text-center border-gold/10">
            <p className="font-sans text-[9px] text-t4 mb-0.5">Zone optimale</p>
            <p className="font-sans text-xs text-gold">{b.optimal_min} – {b.optimal_max} {b.unit}</p>
          </div>
        )}
      </div>

      <p className="font-sans text-[10px] text-t4 mt-3">
        Mesuré le {new Date(b.measured_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}

function BiomarkeursTab({ biomarkers }: { biomarkers: BiomarkerResult[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  if (biomarkers.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="font-sans text-sm text-t3 mb-2">Aucun biomarqueur enregistré.</p>
        <p className="font-sans text-xs text-t4 mb-6">
          Scannez un bilan sanguin pour alimenter ORACLE avec vos données biologiques.
        </p>
        <a href="/app/scanner" className="btn-gold h-10 px-6 inline-flex items-center text-[10px]">
          Scanner un bilan
        </a>
      </div>
    )
  }

  // Grouper par catégorie, anomalies en premier
  const sorted = [...biomarkers].sort((a, b) => {
    const sa = getStatus(a)
    const sb = getStatus(b)
    const order = { high: 0, low: 1, unknown: 2, optimal: 3 }
    return (order[sa] ?? 4) - (order[sb] ?? 4)
  })

  const grouped = sorted.reduce((acc, b) => {
    const cat = b.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(b)
    return acc
  }, {} as Record<string, BiomarkerResult[]>)

  const anomalies = sorted.filter((b) => {
    const s = getStatus(b)
    return s === 'low' || s === 'high'
  })

  const selectedBio = selected ? biomarkers.find((b) => b.id === selected) : null

  return (
    <div className="px-5 py-4">
      {selectedBio && (
        <BiomarkerDetail b={selectedBio} onClose={() => setSelected(null)} />
      )}

      {/* Alertes */}
      {anomalies.length > 0 && (
        <div className="glass p-4 mb-4 border border-red-500/10">
          <p className="label mb-3 text-red-400">Anomalies détectées ({anomalies.length})</p>
          <div className="flex flex-wrap gap-2">
            {anomalies.map((b) => (
              <BiomarkerPill
                key={b.id}
                name={b.name}
                value={b.value}
                unit={b.unit ?? undefined}
                status={getStatus(b)}
                onClick={() => setSelected(selected === b.id ? null : b.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Par catégorie */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-4">
          <p className="label mb-3">{CATEGORY_LABELS[cat] ?? cat}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((b) => (
              <BiomarkerPill
                key={b.id}
                name={b.name}
                value={b.value}
                unit={b.unit ?? undefined}
                status={getStatus(b)}
                onClick={() => setSelected(selected === b.id ? null : b.id)}
              />
            ))}
          </div>
        </div>
      ))}

      <a href="/app/scanner" className="btn-outline h-9 w-full flex items-center justify-center text-[10px] mt-2">
        Mettre à jour les biomarqueurs
      </a>
    </div>
  )
}

function ScoreTrend({ history }: { history: ScoreHistory[] }) {
  if (history.length < 2) return null

  const max = 100
  const h = 60
  const w = history.length

  const points = history.map((s, i) => ({
    x: (i / (w - 1)) * 100,
    y: ((max - s.score) / max) * h,
    score: s.score,
    date: s.calculated_at,
  }))

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fill = `${d} L 100 ${h} L 0 ${h} Z`

  return (
    <div className="glass p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="label">Tendance ORACLE</p>
        <span className="font-sans text-[10px] text-t4">{history.length} jours</span>
      </div>
      <svg viewBox={`0 0 100 ${h}`} className="w-full" style={{ height: 80 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#scoreGrad)" />
        <path d={d} stroke="#c9a96e" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between mt-1">
        <span className="font-sans text-[9px] text-t4">{new Date(history[0].calculated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        <span className="font-sans text-[9px] text-t4">{new Date(history[history.length - 1].calculated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}

function RapportsTab({ scoreHistory, dailyBrief, currentScore }: {
  scoreHistory: ScoreHistory[]
  dailyBrief: DailyBrief | null
  currentScore: number
}) {
  const latest = scoreHistory[scoreHistory.length - 1]

  const subScores = latest ? [
    { label: 'Sommeil', value: latest.sleep_score ?? 0 },
    { label: 'Récupération', value: latest.recovery_score ?? 0 },
    { label: 'Activité', value: latest.activity_score ?? 0 },
    { label: 'Biomarqueurs', value: latest.biomarker_score ?? 0 },
    { label: 'Compliance', value: latest.compliance_score ?? 0 },
  ] : []

  function parseBrief(content: string) {
    const lines = content.split('\n').filter((l) => l.trim())
    return lines
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Daily Brief */}
      {dailyBrief ? (
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="label text-gold">Daily Brief</p>
            <p className="font-sans text-[10px] text-t4">
              {new Date(dailyBrief.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="space-y-2">
            {parseBrief(dailyBrief.content).map((line, i) => (
              <p key={i} className={`font-sans text-xs leading-relaxed ${line.startsWith('PRIORITÉS') || line.startsWith('RÉSUMÉ') || line.startsWith('SCORE') || line.startsWith('BRIEF') ? 'text-t4 text-[9px] uppercase tracking-wider mt-3' : 'text-t2'}`}>
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass p-5 text-center">
          <p className="font-sans text-xs text-t3 mb-2">Aucun Daily Brief généré aujourd'hui.</p>
          <p className="font-sans text-[10px] text-t4 mb-4">Demandez à ORACLE de générer votre brief quotidien.</p>
        </div>
      )}

      {/* Tendance score */}
      <ScoreTrend history={scoreHistory} />

      {/* Sous-scores */}
      {subScores.length > 0 && (
        <div className="glass p-5">
          <p className="label mb-4">Sous-scores du jour</p>
          <div className="flex flex-col gap-3">
            {subScores.map((s) => (
              <MiniBar key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </div>
      )}

      {/* CTA recalcul */}
      <button
        className="btn-outline h-10 flex items-center justify-center text-[10px] w-full"
        onClick={async () => {
          await fetch('/api/scores/calculate', { method: 'POST' })
          window.location.reload()
        }}
      >
        Recalculer mon score ORACLE
      </button>
    </div>
  )
}

export default function OracleDashboard({ memberId, biomarkers, scoreHistory, dailyBrief, currentScore }: Props) {
  const [tab, setTab] = useState<Tab>('Chat')
  const anomalyCount = biomarkers.filter((b) => {
    const s = getStatus(b)
    return s === 'low' || s === 'high'
  }).length

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
            {t === 'Biomarqueurs' && anomalyCount > 0 && (
              <span className="ml-1.5 w-4 h-4 rounded-full bg-red-500/20 font-sans text-[8px] text-red-400 inline-flex items-center justify-center">
                {anomalyCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <AgentChat agent={AGENT} memberId={memberId} />}
      {tab === 'Biomarqueurs' && <BiomarkeursTab biomarkers={biomarkers} />}
      {tab === 'Rapports' && (
        <RapportsTab scoreHistory={scoreHistory} dailyBrief={dailyBrief} currentScore={currentScore} />
      )}
    </div>
  )
}
