import type { Question } from './questions'

interface QuestionScreenProps {
  question: Question
  value: string | string[] | number | null
  onChange: (value: string | string[] | number) => void
  onNext: () => void
  onBack: () => void
  isFirst: boolean
  isLast: boolean
  isSaving: boolean
}

// Choix unique
function SingleChoice({
  options,
  value,
  onChange,
  onNext,
}: {
  options: string[]
  value: string | null
  onChange: (v: string) => void
  onNext: () => void
}) {
  const select = (opt: string) => {
    onChange(opt)
    setTimeout(onNext, 220)
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => select(opt)}
          className={[
            'w-full text-left px-5 py-4 rounded-[14px] border font-sans text-sm transition-all duration-150',
            value === opt
              ? 'border-gold/60 bg-gold/10 text-t1'
              : 'border-white/[0.08] bg-white/[0.02] text-t2 hover:border-gold/30 hover:text-t1',
          ].join(' ')}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// Choix multiple
function MultipleChoice({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={[
            'w-full text-left px-5 py-4 rounded-[14px] border font-sans text-sm transition-all duration-150 flex items-center gap-3',
            value.includes(opt)
              ? 'border-gold/60 bg-gold/10 text-t1'
              : 'border-white/[0.08] bg-white/[0.02] text-t2 hover:border-gold/30 hover:text-t1',
          ].join(' ')}
        >
          <span
            className={[
              'flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all',
              value.includes(opt) ? 'bg-gold border-gold' : 'border-white/20',
            ].join(' ')}
          >
            {value.includes(opt) && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {opt}
        </button>
      ))}
    </div>
  )
}

// Slider / scale
function Scale({
  min,
  max,
  unit,
  value,
  onChange,
}: {
  min: number
  max: number
  unit?: string
  value: number | null
  onChange: (v: number) => void
}) {
  const range = Array.from({ length: max - min + 1 }, (_, i) => i + min)
  const current = value ?? min

  // Pour les grandes plages (> 12 valeurs), on utilise un slider
  if (range.length > 12) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <span className="font-sans text-xs text-t4">{min} {unit}</span>
          <span className="font-serif text-3xl text-t1">{current} <span className="font-sans text-base text-t3">{unit}</span></span>
          <span className="font-sans text-xs text-t4">{max} {unit}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-gold"
        />
        <div className="flex justify-between mt-2">
          <span className="font-sans text-[10px] text-t4">{min}</span>
          <span className="font-sans text-[10px] text-t4">{max}</span>
        </div>
      </div>
    )
  }

  // Pour les petites plages (≤ 12 valeurs), on affiche des cercles
  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <span className="font-serif text-4xl text-t1">{current}</span>
        {unit && <span className="font-sans text-sm text-t3 ml-2">{unit}</span>}
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {range.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={[
              'w-10 h-10 rounded-full font-sans text-sm font-medium transition-all duration-150',
              current === n
                ? 'bg-gold text-bg'
                : 'bg-white/[0.04] border border-white/[0.08] text-t3 hover:border-gold/30 hover:text-t1',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// Saisie texte
function TextInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Votre réponse…'}
      rows={3}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 font-sans text-sm text-t1 placeholder:text-t4 resize-none focus:outline-none focus:border-gold/40 transition-colors"
    />
  )
}

// Saisie numérique
function NumberInput({
  min,
  max,
  unit,
  placeholder,
  value,
  onChange,
}: {
  min?: number
  max?: number
  unit?: string
  placeholder?: string
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder ?? ''}
        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 font-sans text-sm text-t1 placeholder:text-t4 focus:outline-none focus:border-gold/40 transition-colors text-center text-2xl font-medium"
      />
      {unit && <span className="font-sans text-sm text-t3">{unit}</span>}
    </div>
  )
}

export default function QuestionScreen({
  question,
  value,
  onChange,
  onNext,
  onBack,
  isFirst,
  isLast,
  isSaving,
}: QuestionScreenProps) {
  const isEmpty = value === null || value === '' || (Array.isArray(value) && value.length === 0)

  return (
    <div className="w-full animate-fade-in">
      {/* Question */}
      <h2 className="font-serif text-2xl text-t1 italic leading-snug mb-2">
        {question.question}
      </h2>
      {question.subtitle && (
        <p className="font-sans text-sm text-t3 mb-8 leading-relaxed">{question.subtitle}</p>
      )}
      {!question.subtitle && <div className="mb-8" />}

      {/* Input selon type */}
      <div className="mb-10">
        {question.type === 'single' && (
          <SingleChoice
            options={question.options!}
            value={(value as string) ?? null}
            onChange={(v) => onChange(v)}
            onNext={onNext}
          />
        )}
        {question.type === 'multiple' && (
          <MultipleChoice
            options={question.options!}
            value={(value as string[]) ?? []}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === 'scale' && (
          <Scale
            min={question.min!}
            max={question.max!}
            unit={question.unit}
            value={(value as number) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === 'text' && (
          <TextInput
            placeholder={question.placeholder}
            value={(value as string) ?? ''}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === 'number' && (
          <NumberInput
            min={question.min}
            max={question.max}
            unit={question.unit}
            placeholder={question.placeholder}
            value={(value as number) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {!isFirst && (
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-white/[0.08] font-sans text-sm text-t3 hover:text-t1 hover:border-white/20 transition-all"
          >
            Retour
          </button>
        )}

        {/* Bouton Suivant visible pour les types non-single (single auto-avance) */}
        {question.type !== 'single' && (
          <button
            onClick={onNext}
            disabled={isEmpty && question.required}
            className={[
              'flex-1 py-3 rounded-xl font-sans text-sm font-medium transition-all',
              isEmpty && question.required
                ? 'bg-white/[0.04] text-t4 cursor-not-allowed border border-white/[0.06]'
                : isLast
                ? 'bg-gold text-bg hover:bg-gold-hover'
                : 'bg-white/[0.08] text-t1 hover:bg-white/[0.12] border border-white/[0.08]',
            ].join(' ')}
          >
            {isSaving ? 'Enregistrement…' : isLast ? 'Terminer l\'onboarding' : 'Continuer'}
          </button>
        )}

        {/* Pour single : bouton Passer si non-required */}
        {question.type === 'single' && !question.required && (
          <button
            onClick={onNext}
            className="ml-auto font-sans text-xs text-t4 hover:text-t3 transition-colors"
          >
            Passer →
          </button>
        )}
      </div>
    </div>
  )
}
