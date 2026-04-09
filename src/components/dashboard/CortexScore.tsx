import { ScoreRing } from '../ui/ScoreRing'
import { MiniBar } from '../ui/MiniBar'

export interface ScoreData {
  score: number
  level: string
  sleep_score: number | null
  recovery_score: number | null
  activity_score: number | null
  biomarker_score: number | null
  compliance_score: number | null
  calculated_at: string
}

const LEVEL_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum']

interface Props {
  score: number
  data: ScoreData | null
}

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Bronze: 'text-[#8B6914] border-[#8B6914]/30 bg-[#8B6914]/08',
    Silver: 'text-t3 border-white/20 bg-white/04',
    Gold: 'text-gold border-gold/30 bg-gold/08',
    Platinum: 'text-[#E5E4E2] border-[#E5E4E2]/30 bg-white/06',
  }
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-sans font-medium text-[9px] uppercase tracking-[0.18em]',
        colors[level] ?? colors['Bronze'],
      ].join(' ')}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {level}
    </span>
  )
}

export default function CortexScore({ score, data }: Props) {
  const level = data?.level ?? (score >= 85 ? 'Platinum' : score >= 70 ? 'Gold' : score >= 50 ? 'Silver' : 'Bronze')
  const hasSubScores = data && (
    data.sleep_score !== null || data.activity_score !== null
  )

  const subScores = [
    { label: 'Sommeil', value: data?.sleep_score ?? 0, highlight: (data?.sleep_score ?? 0) >= 70 },
    { label: 'Récupération', value: data?.recovery_score ?? 0, highlight: (data?.recovery_score ?? 0) >= 70 },
    { label: 'Activité', value: data?.activity_score ?? 0, highlight: (data?.activity_score ?? 0) >= 70 },
    { label: 'Biomarqueurs', value: data?.biomarker_score ?? 0, highlight: (data?.biomarker_score ?? 0) >= 70 },
    { label: 'Compliance', value: data?.compliance_score ?? 0, highlight: (data?.compliance_score ?? 0) >= 70 },
  ]

  return (
    <section className="px-5 pt-6 pb-2">
      {/* Ring + level */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <ScoreRing score={score} size={180} strokeWidth={10} label="CORTEX" />
        <LevelBadge level={level} />
        {data?.calculated_at && (
          <p className="font-sans text-[10px] text-t4">
            Calculé le{' '}
            {new Date(data.calculated_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
            })}
          </p>
        )}
      </div>

      {/* Sub-scores */}
      {hasSubScores ? (
        <div className="glass p-5 flex flex-col gap-4">
          {subScores.map((s) => (
            <MiniBar key={s.label} label={s.label} value={s.value} max={100} unit="" highlight={s.highlight} />
          ))}
        </div>
      ) : (
        <div className="glass p-5 text-center">
          <p className="font-sans text-xs text-t4 leading-relaxed">
            Connectez un wearable ou scannez vos biomarqueurs pour afficher votre score détaillé.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <a href="/app/scanner" className="btn-outline text-[9px] px-4 h-8">Scanner</a>
            <a href="/app/profile" className="btn-outline text-[9px] px-4 h-8">Wearable</a>
          </div>
        </div>
      )}
    </section>
  )
}
