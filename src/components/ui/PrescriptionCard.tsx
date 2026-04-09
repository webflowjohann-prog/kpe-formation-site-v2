export type PrescriptionType =
  | 'training'
  | 'nutrition'
  | 'supplement'
  | 'sleep'
  | 'mental'
  | 'experience'

export type PrescriptionStatus = 'active' | 'completed' | 'skipped'

export interface Prescription {
  id: string
  agent: string
  type: PrescriptionType
  title: string
  description: string
  timing?: string
  duration?: string
  priority?: 'high' | 'medium' | 'low'
  status: PrescriptionStatus
}

interface PrescriptionCardProps {
  prescription: Prescription
  onComplete?: (id: string) => void
  onSkip?: (id: string) => void
}

const TYPE_LABELS: Record<PrescriptionType, string> = {
  training: 'Entraînement',
  nutrition: 'Nutrition',
  supplement: 'Supplément',
  sleep: 'Sommeil',
  mental: 'Mental',
  experience: 'Expérience',
}

export function PrescriptionCard({ prescription, onComplete, onSkip }: PrescriptionCardProps) {
  const { id, agent, type, title, description, timing, duration, status } = prescription
  const isDone = status === 'completed' || status === 'skipped'

  return (
    <div
      className={[
        'bg-card border rounded-[20px] p-5 transition-all duration-200',
        isDone
          ? 'border-white/[0.04] opacity-50'
          : 'border-white/[0.06] hover:border-gold/20',
      ].join(' ')}
    >
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="label text-gold shrink-0">{agent}</span>
          <span className="w-px h-3 bg-white/10 shrink-0" aria-hidden="true" />
          <span className="label shrink-0">{TYPE_LABELS[type]}</span>
        </div>

        {status === 'active' && (
          <div className="flex items-center gap-2 shrink-0">
            {onSkip && (
              <button
                onClick={() => onSkip(id)}
                className="label hover:text-t2 transition-colors"
              >
                Ignorer
              </button>
            )}
            {onComplete && (
              <button
                onClick={() => onComplete(id)}
                className="h-7 px-3 bg-gold/10 border border-gold/25 rounded-[8px] label text-gold hover:bg-gold/20 transition-all"
              >
                Fait
              </button>
            )}
          </div>
        )}

        {status === 'completed' && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-gold shrink-0"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.4" />
            <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Contenu */}
      <h3 className="font-sans text-sm font-medium text-t1 mb-1 leading-snug">{title}</h3>
      <p className="font-sans text-xs text-t3 leading-relaxed">{description}</p>

      {/* Meta */}
      {(timing || duration) && (
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.06]">
          {timing && (
            <span className="font-sans text-[10px] text-t4 flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 3v2l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {timing}
            </span>
          )}
          {duration && (
            <span className="font-sans text-[10px] text-t4">{duration}</span>
          )}
        </div>
      )}
    </div>
  )
}
