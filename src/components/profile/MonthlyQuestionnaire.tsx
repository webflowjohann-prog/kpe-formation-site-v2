import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

interface MonthlyData {
  energy_level: number | null
  mood_level: number | null
  stress_level: number | null
  sleep_satisfaction: number | null
  training_satisfaction: number | null
  nutrition_satisfaction: number | null
  top_challenge: string | null
  top_win: string | null
  notes: string | null
}

interface Props {
  memberId: string
  month: string
  existing: MonthlyData | null
}

const SCALES = [
  { key: 'energy_level', label: "Niveau d'énergie général", emoji: '⚡', desc: '1 = épuisé, 10 = plein d\'énergie' },
  { key: 'mood_level', label: 'Humeur & bien-être', emoji: '🧠', desc: '1 = très bas, 10 = excellent' },
  { key: 'stress_level', label: 'Niveau de stress', emoji: '🌀', desc: '1 = très stressé, 10 = très serein' },
  { key: 'sleep_satisfaction', label: 'Satisfaction du sommeil', emoji: '🌙', desc: '1 = très mauvais, 10 = excellent' },
  { key: 'training_satisfaction', label: "Satisfaction à l'entraînement", emoji: '⚡', desc: '1 = aucun entraînement, 10 = objectifs atteints' },
  { key: 'nutrition_satisfaction', label: 'Satisfaction nutritionnelle', emoji: '🥗', desc: '1 = très mauvaise, 10 = optimale' },
] as const

type ScaleKey = (typeof SCALES)[number]['key']

function ScaleInput({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={[
            'flex-1 h-8 rounded-lg font-sans text-xs font-medium transition-all',
            value === n
              ? 'bg-gold text-bg'
              : 'bg-white/[0.04] text-t4 hover:bg-white/[0.08] hover:text-t2',
          ].join(' ')}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export default function MonthlyQuestionnaire({ memberId, month, existing }: Props) {
  const [data, setData] = useState<MonthlyData>({
    energy_level: existing?.energy_level ?? null,
    mood_level: existing?.mood_level ?? null,
    stress_level: existing?.stress_level ?? null,
    sleep_satisfaction: existing?.sleep_satisfaction ?? null,
    training_satisfaction: existing?.training_satisfaction ?? null,
    nutrition_satisfaction: existing?.nutrition_satisfaction ?? null,
    top_challenge: existing?.top_challenge ?? null,
    top_win: existing?.top_win ?? null,
    notes: existing?.notes ?? null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!existing)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof MonthlyData, value: string | number | null) {
    setData((d) => ({ ...d, [key]: value }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const sb = getSupabase()
      const { error: err } = await sb.from('monthly_responses').upsert({
        member_id: memberId,
        month,
        ...data,
      }, { onConflict: 'member_id,month' })
      if (err) throw err
      setSaved(true)
    } catch {
      setError("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const answered = SCALES.filter((s) => data[s.key] !== null).length

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-sans text-xs text-t3">{answered} / {SCALES.length} métriques renseignées</span>
          {saved && <span className="font-sans text-[10px] text-green-400">Enregistré</span>}
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${(answered / SCALES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Échelles */}
      {SCALES.map((s) => (
        <div key={s.key} className="glass p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{s.emoji}</span>
            <p className="font-sans text-sm font-medium text-t1">{s.label}</p>
          </div>
          <p className="font-sans text-[10px] text-t4 mb-3">{s.desc}</p>
          <ScaleInput
            value={data[s.key as ScaleKey]}
            onChange={(v) => set(s.key as ScaleKey, v)}
          />
          {data[s.key as ScaleKey] && (
            <p className="font-sans text-[10px] text-gold mt-2 text-right">{data[s.key as ScaleKey]}/10</p>
          )}
        </div>
      ))}

      {/* Questions ouvertes */}
      <div className="glass p-5">
        <p className="font-sans text-sm font-medium text-t1 mb-3">Défi principal du mois</p>
        <textarea
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 font-sans text-sm text-t2 placeholder-t4 resize-none focus:outline-none focus:border-gold/30 transition-colors"
          rows={3}
          placeholder="Qu'est-ce qui a été le plus difficile ce mois-ci ?"
          value={data.top_challenge ?? ''}
          onChange={(e) => set('top_challenge', e.target.value || null)}
        />
      </div>

      <div className="glass p-5">
        <p className="font-sans text-sm font-medium text-t1 mb-3">Victoire du mois</p>
        <textarea
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 font-sans text-sm text-t2 placeholder-t4 resize-none focus:outline-none focus:border-gold/30 transition-colors"
          rows={3}
          placeholder="Quelle est votre plus grande réussite ce mois-ci ?"
          value={data.top_win ?? ''}
          onChange={(e) => set('top_win', e.target.value || null)}
        />
      </div>

      <div className="glass p-5">
        <p className="font-sans text-sm font-medium text-t1 mb-3">Notes libres</p>
        <textarea
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 font-sans text-sm text-t2 placeholder-t4 resize-none focus:outline-none focus:border-gold/30 transition-colors"
          rows={4}
          placeholder="Tout ce que vous souhaitez partager avec vos agents…"
          value={data.notes ?? ''}
          onChange={(e) => set('notes', e.target.value || null)}
        />
      </div>

      {error && <p className="font-sans text-xs text-red-400">{error}</p>}

      <button
        onClick={save}
        disabled={saving || answered === 0}
        className="btn-gold h-12 w-full text-sm disabled:opacity-40"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
            Enregistrement…
          </span>
        ) : saved ? 'Bilan enregistré' : 'Enregistrer le bilan'}
      </button>

      {saved && (
        <p className="font-sans text-[10px] text-t4 text-center">
          ORACLE intégrera ce bilan dans votre prochain rapport mensuel.
        </p>
      )}
    </div>
  )
}
