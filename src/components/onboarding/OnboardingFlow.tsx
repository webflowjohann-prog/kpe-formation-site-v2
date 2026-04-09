import { useState, useCallback } from 'react'
import { QUESTIONS, TOTAL_QUESTIONS } from './questions'
import ProgressBar from './ProgressBar'
import QuestionScreen from './QuestionScreen'

// Intervalle de sauvegarde automatique (toutes les N questions)
const SAVE_INTERVAL = 10

type Answers = Record<string, string | string[] | number | null>

export default function OnboardingFlow() {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const question = QUESTIONS[index]
  const currentValue = answers[question.memberField] ?? null

  // Sauvegarder les réponses en cours vers l'API
  const save = useCallback(
    async (finalAnswers: Answers, completed = false) => {
      try {
        const res = await fetch('/api/onboarding/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: finalAnswers, completed }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Erreur de sauvegarde')
        }
      } catch (err) {
        throw err
      }
    },
    []
  )

  const handleChange = useCallback(
    (value: string | string[] | number) => {
      setAnswers((prev) => ({ ...prev, [question.memberField]: value }))
      setError(null)
    },
    [question.memberField]
  )

  const handleNext = useCallback(async () => {
    const isLast = index === TOTAL_QUESTIONS - 1

    // Vérification champ requis
    const val = answers[question.memberField] ?? null
    const isEmpty = val === null || val === '' || (Array.isArray(val) && val.length === 0)
    if (question.required && isEmpty) {
      setError('Cette question est obligatoire')
      return
    }

    const updatedAnswers = { ...answers }

    if (isLast) {
      setIsSaving(true)
      try {
        await save(updatedAnswers, true)
        setDone(true)
        // Redirect après un court délai pour afficher la confirmation
        setTimeout(() => {
          window.location.href = '/app'
        }, 1800)
      } catch (err) {
        setError('Erreur de sauvegarde. Réessayez.')
        setIsSaving(false)
      }
      return
    }

    // Sauvegarde intermédiaire tous les SAVE_INTERVAL questions
    const nextIndex = index + 1
    if (nextIndex % SAVE_INTERVAL === 0) {
      setIsSaving(true)
      try {
        await save(updatedAnswers, false)
      } catch {
        // Silencieux — on continue quand même
      }
      setIsSaving(false)
    }

    setIndex(nextIndex)
  }, [index, answers, question, save])

  const handleBack = useCallback(() => {
    if (index > 0) setIndex(index - 1)
    setError(null)
  }, [index])

  // Écran de complétion
  if (done) {
    return (
      <div className="w-full text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center mx-auto mb-8">
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
            <path d="M2 11L10 19L26 3" stroke="#c9a96e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl text-t1 italic mb-3">Profil calibré</h2>
        <p className="font-sans text-sm text-t3 leading-relaxed max-w-xs mx-auto mb-6">
          Vos 6 agents IA sont en train d'analyser votre profil et de préparer votre premier Daily Brief.
        </p>
        <p className="font-sans text-xs text-t4">Redirection vers votre dashboard…</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Progress */}
      <div className="mb-12">
        <ProgressBar
          current={index + 1}
          total={TOTAL_QUESTIONS}
          category={question.categoryLabel}
        />
      </div>

      {/* Question courante */}
      <QuestionScreen
        question={question}
        value={currentValue}
        onChange={handleChange}
        onNext={handleNext}
        onBack={handleBack}
        isFirst={index === 0}
        isLast={index === TOTAL_QUESTIONS - 1}
        isSaving={isSaving}
      />

      {/* Erreur */}
      {error && (
        <p className="mt-4 font-sans text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}
