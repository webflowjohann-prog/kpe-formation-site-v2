export interface KnownBiomarker {
  id: string
  name: string
  aliases: string[]
  category: string
  standard_unit: string | null
  normal_min: number | null
  normal_max: number | null
  optimal_min: number | null
  optimal_max: number | null
}

/** Normalise : minuscules, sans accents, sans ponctuation */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Score de similarité entre deux strings normalisées */
function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)

  if (na === nb) return 1.0
  if (na.includes(nb) || nb.includes(na)) return 0.9

  // Jaccard sur les mots
  const wa = new Set(na.split(' ').filter(Boolean))
  const wb = new Set(nb.split(' ').filter(Boolean))
  const intersection = [...wa].filter((w) => wb.has(w)).length
  const union = new Set([...wa, ...wb]).size
  if (union === 0) return 0

  return intersection / union
}

export interface MatchResult {
  biomarker: KnownBiomarker | null
  confidence: number
}

export function matchBiomarker(
  extractedName: string,
  knownBiomarkers: KnownBiomarker[],
  minConfidence = 0.45
): MatchResult {
  let best: KnownBiomarker | null = null
  let bestScore = 0

  for (const kb of knownBiomarkers) {
    const candidates = [kb.name, ...kb.aliases]
    for (const candidate of candidates) {
      const score = similarity(extractedName, candidate)
      if (score > bestScore) {
        bestScore = score
        best = kb
      }
    }
  }

  if (bestScore < minConfidence) {
    return { biomarker: null, confidence: bestScore }
  }

  return { biomarker: best, confidence: parseFloat(bestScore.toFixed(2)) }
}

/** Évalue le statut d'un résultat par rapport aux valeurs normales */
export function evaluateStatus(
  value: number,
  biomarker: KnownBiomarker
): 'optimal' | 'normal' | 'low' | 'high' | 'unknown' {
  const { normal_min, normal_max, optimal_min, optimal_max } = biomarker

  if (normal_min !== null && value < normal_min) return 'low'
  if (normal_max !== null && value > normal_max) return 'high'
  if (optimal_min !== null && optimal_max !== null) {
    if (value >= optimal_min && value <= optimal_max) return 'optimal'
  }
  if (normal_min !== null && normal_max !== null) return 'normal'
  return 'unknown'
}
