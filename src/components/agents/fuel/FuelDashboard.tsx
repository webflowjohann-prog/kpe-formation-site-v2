import { useState } from 'react'
import AgentChat from '../AgentChat'
import type { AgentId } from '@/stores/chat'

const AGENT: AgentId = 'fuel'

interface Supplement {
  id: string
  title: string
  description: string | null
  timing: string | null
  duration: string | null
  priority: string
}

interface Props {
  memberId: string
  supplements: Supplement[]
}

const TABS = ['Chat', 'Suppléments', 'Boutique'] as const
type Tab = (typeof TABS)[number]

function SupplementsTab({ supplements }: { supplements: Supplement[] }) {
  if (supplements.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gold/08 border border-gold/15 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-gold opacity-60">
            <path d="M8 4h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="font-sans text-sm text-t3 leading-relaxed mb-2">
          Aucun supplément prescrit pour l'instant.
        </p>
        <p className="font-sans text-xs text-t4 leading-relaxed">
          Parlez à FUEL dans l'onglet Chat pour recevoir vos premières prescriptions.
        </p>
      </div>
    )
  }

  const PRIORITY_LABEL: Record<string, string> = {
    high: 'Prioritaire',
    medium: 'Recommandé',
    low: 'Optionnel',
  }
  const PRIORITY_COLOR: Record<string, string> = {
    high: 'text-gold border-gold/30 bg-gold/08',
    medium: 'text-t2 border-white/15 bg-white/04',
    low: 'text-t4 border-white/08 bg-transparent',
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      {supplements.map((s) => (
        <div key={s.id} className="glass p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-sans text-sm font-medium text-t1">{s.title}</span>
            <span className={`label border rounded-full px-2.5 py-0.5 ${PRIORITY_COLOR[s.priority] ?? PRIORITY_COLOR.medium}`}>
              {PRIORITY_LABEL[s.priority] ?? 'Recommandé'}
            </span>
          </div>
          {s.description && (
            <p className="font-sans text-xs text-t3 leading-relaxed mb-3">{s.description}</p>
          )}
          <div className="flex gap-4">
            {s.timing && (
              <span className="font-sans text-[10px] text-t4 flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M5 3v2l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {s.timing}
              </span>
            )}
            {s.duration && (
              <span className="font-sans text-[10px] text-t4">{s.duration}</span>
            )}
          </div>
        </div>
      ))}
      <a
        href="/app/marketplace"
        className="btn-outline w-full flex items-center justify-center gap-2 h-11 mt-2"
      >
        Commander dans la boutique
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </div>
  )
}

function BoutiqueTab() {
  return (
    <div className="px-5 py-4">
      <p className="font-sans text-xs text-t3 mb-4 leading-relaxed">
        FUEL prescrit directement les suppléments adaptés à vos carences. Retrouvez vos prescriptions et commandez depuis la boutique.
      </p>
      <a
        href="/app/marketplace"
        className="btn-gold w-full flex items-center justify-center gap-2 h-12 mb-3"
      >
        Ouvrir la boutique
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 6h10M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {[
          { label: 'Magnésium', sublabel: 'Sommeil & Stress' },
          { label: 'Oméga-3', sublabel: 'Anti-inflammatoire' },
          { label: 'Créatine', sublabel: 'Force & Récupération' },
          { label: 'Vitamine D3', sublabel: 'Immunité & Os' },
        ].map((item) => (
          <a
            key={item.label}
            href="/app/marketplace"
            className="glass p-4 hover:border-gold/25 transition-all active:scale-[0.98]"
          >
            <p className="font-sans text-xs font-medium text-t1 mb-0.5">{item.label}</p>
            <p className="font-sans text-[10px] text-t4">{item.sublabel}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function FuelDashboard({ memberId, supplements }: Props) {
  const [tab, setTab] = useState<Tab>('Chat')

  return (
    <div>
      {/* Onglets */}
      <div className="flex gap-0 border-b border-white/[0.06] px-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-3 font-sans text-xs font-medium transition-all border-b-2 -mb-px',
              tab === t
                ? 'text-gold border-gold'
                : 'text-t4 border-transparent hover:text-t2',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <AgentChat agent={AGENT} memberId={memberId} />}
      {tab === 'Suppléments' && <SupplementsTab supplements={supplements} />}
      {tab === 'Boutique' && <BoutiqueTab />}
    </div>
  )
}
