import { useState } from 'react'
import AgentChat from '../AgentChat'
import type { AgentId } from '@/stores/chat'

const AGENT: AgentId = 'atlas'

interface Experience {
  id: string
  title: string
  short_desc: string | null
  location: string
  country: string
  category: string
  date_start: string | null
  date_end: string | null
  duration_days: number | null
  capacity: number
  spots_remaining: number
  price_cents: number
  min_oracle_score: number
  status: string
  biomarker_requirements: Array<{ biomarker: string; min_value?: number; max_value?: number; description: string }>
  prep_weeks: number | null
}

interface Booking {
  id: string
  experience_id: string
  status: string
  booked_at: string
  amount_cents: number | null
}

interface Props {
  memberId: string
  cortexScore: number
  experiences: Experience[]
  bookings: Booking[]
}

const TABS = ['Chat', 'Expériences', 'Mes drops'] as const
type Tab = (typeof TABS)[number]

const CATEGORY_LABELS: Record<string, string> = {
  altitude: 'Altitude',
  polar: 'Polaire',
  desert: 'Désert',
  sea: 'Mer',
  jungle: 'Jungle',
  urban: 'Urban',
}

const CATEGORY_COLORS: Record<string, string> = {
  altitude: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
  polar: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
  desert: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
  sea: 'text-teal-400 border-teal-500/20 bg-teal-500/5',
  jungle: 'text-green-400 border-green-500/20 bg-green-500/5',
  urban: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Bientôt', color: 'text-t4 border-white/10' },
  open: { label: 'Ouvert', color: 'text-green-400 border-green-500/20' },
  full: { label: 'Complet', color: 'text-red-400 border-red-500/20' },
  confirmed: { label: 'Confirmé', color: 'text-gold border-gold/20' },
  past: { label: 'Passé', color: 'text-t4 border-white/10' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100)
}

function EligibilityBadge({ score, minScore }: { score: number; minScore: number }) {
  const eligible = score >= minScore
  return (
    <span className={`flex items-center gap-1 font-sans text-[9px] px-2 py-0.5 rounded-full border ${eligible ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5'}`}>
      <span className={`w-1 h-1 rounded-full ${eligible ? 'bg-green-400' : 'bg-red-400'}`} />
      {eligible ? 'Éligible' : `Score min. ${minScore}`}
    </span>
  )
}

function ExperienceCard({
  exp,
  cortexScore,
  isBooked,
  onBook,
  booking,
}: {
  exp: Experience
  cortexScore: number
  isBooked: boolean
  onBook: (id: string) => void
  booking?: Booking
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eligible = cortexScore >= exp.min_oracle_score
  const status = STATUS_LABELS[exp.status] ?? STATUS_LABELS.upcoming
  const catColor = CATEGORY_COLORS[exp.category] ?? 'text-t4 border-white/10'

  async function handleBook() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/experiences/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experience_id: exp.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur de réservation')
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  return (
    <div className="glass overflow-hidden">
      {/* Header */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full border font-sans text-[9px] ${catColor}`}>
                {CATEGORY_LABELS[exp.category] ?? exp.category}
              </span>
              <span className={`px-2 py-0.5 rounded-full border font-sans text-[9px] ${status.color}`}>
                {status.label}
              </span>
              {isBooked && (
                <span className="px-2 py-0.5 rounded-full border border-gold/20 bg-gold/5 font-sans text-[9px] text-gold">
                  Réservé
                </span>
              )}
            </div>
            <h3 className="font-sans text-sm font-semibold text-t1 leading-tight">{exp.title}</h3>
          </div>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className={`text-t4 shrink-0 transition-transform mt-0.5 ${expanded ? 'rotate-90' : ''}`}
          >
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="font-sans text-[10px] text-t4">Lieu</p>
            <p className="font-sans text-xs text-t2">{exp.location}, {exp.country}</p>
          </div>
          {exp.date_start && (
            <div>
              <p className="font-sans text-[10px] text-t4">Date</p>
              <p className="font-sans text-xs text-t2">{formatDate(exp.date_start)}</p>
            </div>
          )}
          <div>
            <p className="font-sans text-[10px] text-t4">Durée</p>
            <p className="font-sans text-xs text-t2">{exp.duration_days ? `${exp.duration_days}j` : '—'}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-sans text-[10px] text-t4">Prix</p>
            <p className="font-sans text-xs text-gold font-semibold">{formatPrice(exp.price_cents)}</p>
          </div>
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.06] pt-4">
          {exp.short_desc && (
            <p className="font-sans text-xs text-t3 leading-relaxed mb-4">{exp.short_desc}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="glass p-3 text-center">
              <p className="font-sans text-[9px] text-t4 mb-1">Places restantes</p>
              <p className={`font-serif text-xl ${exp.spots_remaining <= 2 ? 'text-red-400' : 'text-t1'}`}>
                {exp.spots_remaining}
              </p>
              <p className="font-sans text-[9px] text-t4">/ {exp.capacity}</p>
            </div>
            <div className="glass p-3 text-center">
              <p className="font-sans text-[9px] text-t4 mb-1">Préparation</p>
              <p className="font-serif text-xl text-t1">{exp.prep_weeks ?? '—'}</p>
              <p className="font-sans text-[9px] text-t4">semaines</p>
            </div>
            <div className="glass p-3 text-center">
              <p className="font-sans text-[9px] text-t4 mb-1">Score min.</p>
              <p className={`font-serif text-xl ${cortexScore >= exp.min_oracle_score ? 'text-green-400' : 'text-red-400'}`}>
                {exp.min_oracle_score}
              </p>
              <p className="font-sans text-[9px] text-t4">ORACLE</p>
            </div>
          </div>

          {/* Éligibilité */}
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-xs text-t3">Votre score ORACLE : <span className="text-t1 font-semibold">{cortexScore}/100</span></p>
            <EligibilityBadge score={cortexScore} minScore={exp.min_oracle_score} />
          </div>

          {/* Biomarker requirements */}
          {exp.biomarker_requirements && exp.biomarker_requirements.length > 0 && (
            <div className="mb-4">
              <p className="font-sans text-[10px] text-t4 mb-2">Biomarqueurs recommandés</p>
              <div className="flex flex-col gap-1.5">
                {exp.biomarker_requirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-gold/60 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-sans text-[10px] text-t2 font-medium">{req.biomarker}</span>
                      {req.description && <span className="font-sans text-[10px] text-t4"> — {req.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="font-sans text-xs text-red-400 mb-3">{error}</p>}

          {/* CTA */}
          {isBooked ? (
            <div className="glass p-3 text-center border-gold/20">
              <p className="font-sans text-xs text-gold">
                {booking?.status === 'confirmed' ? 'Réservation confirmée' : 'Pré-réservation en attente de paiement'}
              </p>
            </div>
          ) : (
            <button
              onClick={handleBook}
              disabled={!eligible || exp.status === 'full' || exp.status === 'past' || loading}
              className="w-full btn-gold h-10 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                  Redirection…
                </span>
              ) : exp.status === 'full' ? 'Complet' : !eligible ? `Score ORACLE insuffisant (${exp.min_oracle_score} requis)` : `Pré-réserver — ${formatPrice(exp.price_cents)}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ExperiencesTab({ experiences, cortexScore, bookings, onBook }: {
  experiences: Experience[]
  cortexScore: number
  bookings: Booking[]
  onBook: (id: string) => void
}) {
  const bookedIds = new Set(bookings.map((b) => b.experience_id))
  const open = experiences.filter((e) => e.status === 'open' || e.status === 'full')
  const upcoming = experiences.filter((e) => e.status === 'upcoming')

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {open.length > 0 && (
        <div>
          <p className="label mb-3">Drops ouverts</p>
          <div className="flex flex-col gap-3">
            {open.map((exp) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                cortexScore={cortexScore}
                isBooked={bookedIds.has(exp.id)}
                booking={bookings.find((b) => b.experience_id === exp.id)}
                onBook={onBook}
              />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <p className="label mb-3">Prochains drops</p>
          <div className="flex flex-col gap-3">
            {upcoming.map((exp) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                cortexScore={cortexScore}
                isBooked={bookedIds.has(exp.id)}
                booking={bookings.find((b) => b.experience_id === exp.id)}
                onBook={onBook}
              />
            ))}
          </div>
        </div>
      )}

      {experiences.length === 0 && (
        <div className="glass p-6 text-center">
          <p className="font-sans text-sm text-t3">Aucune expérience disponible pour le moment.</p>
          <p className="font-sans text-xs text-t4 mt-1">Les prochains drops ATLAS seront annoncés bientôt.</p>
        </div>
      )}
    </div>
  )
}

function DropsTab({ bookings, experiences }: { bookings: Booking[]; experiences: Experience[] }) {
  if (bookings.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="font-sans text-sm text-t3 mb-1">Aucune réservation.</p>
        <p className="font-sans text-xs text-t4">Pré-réservez une expérience ATLAS pour la voir apparaître ici.</p>
      </div>
    )
  }

  const expMap = new Map(experiences.map((e) => [e.id, e]))

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <p className="label">Mes réservations</p>
      {bookings.map((b) => {
        const exp = expMap.get(b.experience_id)
        const statusMap: Record<string, { label: string; color: string }> = {
          pending: { label: 'En attente', color: 'text-gold' },
          confirmed: { label: 'Confirmée', color: 'text-green-400' },
          cancelled: { label: 'Annulée', color: 'text-t4' },
          refunded: { label: 'Remboursée', color: 'text-t4' },
        }
        const st = statusMap[b.status] ?? statusMap.pending

        return (
          <div key={b.id} className="glass p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="font-sans text-sm font-medium text-t1">{exp?.title ?? 'Expérience'}</p>
              <span className={`font-sans text-[10px] ${st.color} shrink-0`}>{st.label}</span>
            </div>
            <p className="font-sans text-[10px] text-t4">
              {exp?.location ? `${exp.location}, ${exp.country}` : '—'}
              {exp?.date_start ? ` — ${formatDate(exp.date_start)}` : ''}
            </p>
            {b.amount_cents && (
              <p className="font-sans text-[10px] text-t4 mt-1">{formatPrice(b.amount_cents)}</p>
            )}
            <p className="font-sans text-[9px] text-t4 mt-2">
              Réservé le {new Date(b.booked_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function AtlasDashboard({ memberId, cortexScore, experiences, bookings }: Props) {
  const [tab, setTab] = useState<Tab>('Chat')
  const [localBookings, setLocalBookings] = useState(bookings)

  function handleBook(id: string) {
    // optimistic — actual redirect happens in ExperienceCard
  }

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
            {t === 'Mes drops' && localBookings.length > 0 && (
              <span className="ml-1.5 w-4 h-4 rounded-full bg-gold/20 font-sans text-[8px] text-gold inline-flex items-center justify-center">
                {localBookings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <AgentChat agent={AGENT} memberId={memberId} />}
      {tab === 'Expériences' && (
        <ExperiencesTab
          experiences={experiences}
          cortexScore={cortexScore}
          bookings={localBookings}
          onBook={handleBook}
        />
      )}
      {tab === 'Mes drops' && (
        <DropsTab bookings={localBookings} experiences={experiences} />
      )}
    </div>
  )
}
