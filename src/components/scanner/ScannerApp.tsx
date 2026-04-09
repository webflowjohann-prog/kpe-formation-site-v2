import { useState, useRef } from 'react'

interface ScanResult {
  raw_name: string
  value: number
  unit: string
  reference_range: string | null
  matched_biomarker_id: string | null
  matched_name: string | null
  matched_category: string | null
  normal_min: number | null
  normal_max: number | null
  confidence: number
}

type Step = 'capture' | 'processing' | 'validate' | 'done'

function statusIcon(value: number, min: number | null, max: number | null) {
  if (min === null && max === null) return null
  if (min !== null && value < min) return { label: 'Bas', color: 'text-blue-400' }
  if (max !== null && value > max) return { label: 'Élevé', color: 'text-red-400' }
  return { label: 'Normal', color: 'text-green-400' }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Retirer le data URL prefix (data:image/jpeg;base64,...)
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ScannerApp() {
  const [step, setStep] = useState<Step>('capture')
  const [preview, setPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg')
  const [results, setResults] = useState<ScanResult[]>([])
  const [editValues, setEditValues] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const mt = file.type as 'image/jpeg' | 'image/png' | 'image/webp'
    setMediaType(mt || 'image/jpeg')
    const b64 = await toBase64(file)
    setPreview(URL.createObjectURL(file))
    await runOcr(b64, mt || 'image/jpeg')
  }

  async function runOcr(base64: string, mt: string) {
    setStep('processing')
    setError(null)

    try {
      const res = await fetch('/api/scanner/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, media_type: mt }),
      })

      if (!res.ok) throw new Error('Erreur OCR')
      const data = await res.json()

      if (!data.results || data.results.length === 0) {
        setError("Aucun biomarqueur détecté. Assurez-vous que l'image est nette et bien cadrée.")
        setStep('capture')
        return
      }

      setResults(data.results)
      setEditValues({})
      setStep('validate')
    } catch {
      setError("Erreur lors de l'analyse. Réessayez.")
      setStep('capture')
    }
  }

  async function confirm() {
    setSaving(true)
    const confirmed = results
      .filter((r) => r.matched_biomarker_id)
      .map((r, i) => ({
        biomarker_id: r.matched_biomarker_id,
        raw_name: r.raw_name,
        value: parseFloat(editValues[i] ?? String(r.value)),
        unit: r.unit,
        confidence: r.confidence,
      }))

    try {
      const res = await fetch('/api/scanner/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: confirmed }),
      })

      if (!res.ok) throw new Error('Erreur de sauvegarde')
      const data = await res.json()
      setFinalScore(data.new_score)
      setStep('done')
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  // ─── STEP: Capture ───────────────────────────────────────────────────────────
  if (step === 'capture') {
    return (
      <div className="px-5 py-4">
        {error && (
          <div className="glass p-4 mb-4 border-red-500/20 bg-red-500/05">
            <p className="font-sans text-xs text-red-400">{error}</p>
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative glass p-8 flex flex-col items-center text-center gap-5 cursor-pointer hover:border-gold/30 transition-all active:scale-[0.98]"
        >
          <div className="w-20 h-20 rounded-full bg-gold/08 border border-gold/15 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gold">
              <rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 6V4M16 4h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-lg text-t1 italic mb-2">Scanner votre bilan</h3>
            <p className="font-sans text-xs text-t3 leading-relaxed">
              Photographiez ou importez votre analyse de sang, d'urine ou tout autre bilan médical.
            </p>
          </div>
          <span className="btn-gold h-10 px-6 text-[9px] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4.5 2V1M7 1h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Choisir une photo
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        <div className="mt-6 glass p-4">
          <p className="label mb-2">Conseils pour un scan optimal</p>
          <ul className="space-y-2">
            {[
              'Bonne luminosité, fond neutre',
              'Document plat et entier dans le cadre',
              'Évitez les reflets et flous',
              'Résolution minimum : 1MP',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gold shrink-0 mt-0.5">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span className="font-sans text-xs text-t3">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  // ─── STEP: Processing ─────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="px-5 py-12 flex flex-col items-center gap-6">
        {preview && (
          <img src={preview} alt="Scan" className="w-40 h-40 object-cover rounded-2xl grayscale opacity-50" />
        )}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 150, 300].map((d) => (
              <span key={d} className="w-2 h-2 rounded-full bg-gold animate-pulse" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
          <p className="font-sans text-sm text-t3">Claude Vision analyse votre bilan…</p>
          <p className="font-sans text-xs text-t4">Extraction et matching des biomarqueurs</p>
        </div>
      </div>
    )
  }

  // ─── STEP: Validate ───────────────────────────────────────────────────────────
  if (step === 'validate') {
    const matched = results.filter((r) => r.matched_biomarker_id)
    const unmatched = results.filter((r) => !r.matched_biomarker_id)

    return (
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-sans text-xs text-t3">{matched.length} biomarqueur{matched.length > 1 ? 's' : ''} identifié{matched.length > 1 ? 's' : ''}</p>
            {unmatched.length > 0 && (
              <p className="font-sans text-[10px] text-t4">{unmatched.length} non reconnu{unmatched.length > 1 ? 's' : ''}</p>
            )}
          </div>
          <button onClick={() => setStep('capture')} className="font-sans text-xs text-t4 hover:text-t2 transition-colors">
            Recommencer
          </button>
        </div>

        {/* Matched results */}
        {matched.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            <span className="label text-gold">Biomarqueurs reconnus</span>
            {matched.map((r, i) => {
              const status = statusIcon(
                parseFloat(editValues[i] ?? String(r.value)),
                r.normal_min,
                r.normal_max
              )
              return (
                <div key={i} className="glass p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-xs font-medium text-t1">{r.matched_name ?? r.raw_name}</p>
                    <p className="font-sans text-[10px] text-t4">{r.raw_name} · {Math.round(r.confidence * 100)}% match</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      step="0.1"
                      value={editValues[i] ?? r.value}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [i]: e.target.value }))}
                      className="w-16 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 font-sans text-xs text-t1 text-right focus:outline-none focus:border-gold/30"
                    />
                    <span className="font-sans text-[10px] text-t4 w-12">{r.unit}</span>
                    {status && <span className={`font-sans text-[9px] font-medium ${status.color}`}>{status.label}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Unmatched */}
        {unmatched.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            <span className="label">Non reconnus (ignorés)</span>
            {unmatched.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-[14px] border border-white/[0.06] bg-white/[0.02] opacity-50">
                <span className="font-sans text-xs text-t3">{r.raw_name}</span>
                <span className="font-sans text-xs text-t4">{r.value} {r.unit}</span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="font-sans text-xs text-red-400 mb-3">{error}</p>}

        <button
          onClick={confirm}
          disabled={matched.length === 0 || saving}
          className="btn-gold w-full h-12 flex items-center justify-center gap-2 text-[10px] disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : `Confirmer ${matched.length} biomarqueur${matched.length > 1 ? 's' : ''}`}
        </button>
      </div>
    )
  }

  // ─── STEP: Done ───────────────────────────────────────────────────────────────
  return (
    <div className="px-5 py-12 flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
        <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
          <path d="M2 11L10 19L26 3" stroke="#c9a96e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h3 className="font-serif text-2xl text-t1 italic mb-2">Bilan enregistré</h3>
        {finalScore !== null && (
          <p className="font-sans text-sm text-t3 mb-1">
            Score ORACLE mis à jour : <span className="text-gold font-medium">{finalScore}/100</span>
          </p>
        )}
        <p className="font-sans text-xs text-t4 leading-relaxed">
          Vos agents ont été notifiés et adaptent leurs prescriptions.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setStep('capture')} className="btn-outline h-10 px-5 text-[9px]">
          Nouveau scan
        </button>
        <a href="/app" className="btn-gold h-10 px-5 text-[9px] flex items-center">
          Dashboard
        </a>
      </div>
    </div>
  )
}
