import { useState } from 'react'
import { PrescriptionCard } from '../ui/PrescriptionCard'
import type { Prescription } from '../ui/PrescriptionCard'
import { getSupabase } from '@/lib/supabase'

const AGENT_LINKS = [
  { id: 'forge', label: 'FORGE', href: '/app/agents/forge' },
  { id: 'morphee', label: 'MORPHÉE', href: '/app/agents/morphee' },
  { id: 'fuel', label: 'FUEL', href: '/app/agents/fuel' },
  { id: 'zenith', label: 'ZÉNITH', href: '/app/agents/zenith' },
]

interface Props {
  initialPrescriptions: Prescription[]
}

export default function PrescriptionTimeline({ initialPrescriptions }: Props) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions)

  async function updateStatus(id: string, status: 'completed' | 'skipped') {
    const sb = getSupabase()
    await sb.from('agent_prescriptions').update({ status }).eq('id', id)
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    )
  }

  const active = prescriptions.filter((p) => p.status === 'active')
  const done = prescriptions.filter((p) => p.status !== 'active')

  if (prescriptions.length === 0) {
    return (
      <section className="px-5 pt-6">
        <span className="label text-gold block mb-3">Prescriptions actives</span>
        <div className="glass p-6">
          <p className="font-sans text-sm text-t3 leading-relaxed mb-5">
            Vos agents génèrent des prescriptions personnalisées lors de vos conversations. Démarrez en parlant à l'un d'eux.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AGENT_LINKS.map((a) => (
              <a
                key={a.id}
                href={a.href}
                className="flex items-center justify-between px-4 py-3 rounded-[14px] border border-white/[0.08] bg-white/[0.02] hover:border-gold/30 transition-all"
              >
                <span className="font-sans font-medium text-xs text-t2">{a.label}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-t4">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="px-5 pt-6">
      <div className="flex items-center justify-between mb-3">
        <span className="label text-gold">Prescriptions actives</span>
        {active.length > 0 && (
          <span className="font-sans text-[10px] text-t4">{active.length} en cours</span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {active.map((p) => (
          <PrescriptionCard
            key={p.id}
            prescription={p}
            onComplete={(id) => updateStatus(id, 'completed')}
            onSkip={(id) => updateStatus(id, 'skipped')}
          />
        ))}

        {done.length > 0 && (
          <>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="label">Terminées</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            {done.map((p) => (
              <PrescriptionCard key={p.id} prescription={p} />
            ))}
          </>
        )}
      </div>
    </section>
  )
}
