// Poids des sous-scores (total = 1.0)
const WEIGHTS = {
  sleep: 0.25,
  recovery: 0.20,
  activity: 0.20,
  biomarker: 0.20,
  compliance: 0.15,
} as const

export interface DailyMetric {
  date: string
  sleep_duration_seconds: number | null
  sleep_efficiency: number | null
  deep_sleep_seconds: number | null
  rem_sleep_seconds: number | null
  hrv_rmssd: number | null
  resting_hr: number | null
  spo2_avg: number | null
  steps: number | null
  active_minutes: number | null
  active_calories: number | null
}

export interface BiomarkerResult {
  biomarker_id: string | null
  value: number
  measured_at: string
}

export interface BiomarkerKnowledge {
  id: string
  normal_min: number | null
  normal_max: number | null
  optimal_min: number | null
  optimal_max: number | null
}

export interface Prescription {
  status: 'active' | 'completed' | 'skipped'
  created_at: string
}

export interface MemberProfile {
  sleep_hours: number | null
  sleep_quality: number | null
  training_frequency: number | null
  resting_hr: number | null
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

function calcSleepScore(metrics: DailyMetric[], member: MemberProfile): number {
  const recent = metrics.slice(0, 7)

  // Fallback sans wearable : utiliser les données d'onboarding
  if (recent.length === 0) {
    const q = member.sleep_quality ?? 5
    const h = member.sleep_hours ?? 7
    const durationScore = h >= 7 && h <= 9 ? 100 : Math.max(0, 100 - Math.abs(h - 8) * 20)
    return Math.round(q * 10 * 0.5 + durationScore * 0.5)
  }

  const scores = recent.map((m) => {
    let s = 0
    let weight = 0

    if (m.sleep_duration_seconds !== null) {
      const h = m.sleep_duration_seconds / 3600
      const ds = Math.max(0, 100 - Math.abs(h - 8) * 20)
      s += ds * 0.4; weight += 0.4
    }
    if (m.sleep_efficiency !== null) {
      s += m.sleep_efficiency * 100 * 0.3; weight += 0.3
    }
    if (m.deep_sleep_seconds !== null && m.sleep_duration_seconds) {
      const pct = m.deep_sleep_seconds / m.sleep_duration_seconds
      s += Math.min((pct / 0.20) * 100, 100) * 0.15; weight += 0.15
    }
    if (m.rem_sleep_seconds !== null && m.sleep_duration_seconds) {
      const pct = m.rem_sleep_seconds / m.sleep_duration_seconds
      s += Math.min((pct / 0.22) * 100, 100) * 0.15; weight += 0.15
    }

    return weight > 0 ? s / weight : 50
  })

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

// ─── Recovery ─────────────────────────────────────────────────────────────────

function calcRecoveryScore(metrics: DailyMetric[], member: MemberProfile): number {
  const recent = metrics.slice(0, 7)

  if (recent.length === 0) return 50

  // Baseline HRV sur 30 jours
  const hrvValues = metrics.filter((m) => m.hrv_rmssd !== null).map((m) => m.hrv_rmssd!)
  const baseline = hrvValues.length >= 3
    ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length
    : null

  // Baseline HR de l'onboarding
  const onboardingHR = member.resting_hr

  const scores = recent.map((m) => {
    let s = 0
    let weight = 0

    // HRV ratio vs baseline
    if (m.hrv_rmssd !== null && baseline) {
      const ratio = m.hrv_rmssd / baseline
      s += Math.min(Math.round(ratio * 80), 100) * 0.6; weight += 0.6
    }

    // Resting HR (plus bas = meilleure récupération)
    if (m.resting_hr !== null) {
      const ref = onboardingHR ?? 65
      const delta = m.resting_hr - ref
      const hrScore = Math.max(0, Math.min(100, 80 - delta * 5))
      s += hrScore * 0.4; weight += 0.4
    }

    return weight > 0 ? s / weight : 50
  })

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

// ─── Activity ─────────────────────────────────────────────────────────────────

function calcActivityScore(metrics: DailyMetric[], member: MemberProfile): number {
  const recent = metrics.slice(0, 7)

  if (recent.length === 0) {
    // Fallback : training_frequency déclaré
    const freq = member.training_frequency ?? 0
    return Math.min(Math.round((freq / 5) * 100), 100)
  }

  const TARGET_STEPS = 8000
  const TARGET_ACTIVE_MIN = 30

  const scores = recent.map((m) => {
    let s = 0; let weight = 0

    if (m.steps !== null) {
      s += Math.min((m.steps / TARGET_STEPS) * 100, 100) * 0.5; weight += 0.5
    }
    if (m.active_minutes !== null) {
      s += Math.min((m.active_minutes / TARGET_ACTIVE_MIN) * 100, 100) * 0.5; weight += 0.5
    }

    return weight > 0 ? s / weight : 30
  })

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

// ─── Biomarkers ───────────────────────────────────────────────────────────────

function calcBiomarkerScore(
  results: BiomarkerResult[],
  knowledge: BiomarkerKnowledge[]
): number {
  if (results.length === 0) return 30

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const recent = results.filter((r) => new Date(r.measured_at) > sixMonthsAgo)
  if (recent.length === 0) return 30

  const kbMap = new Map(knowledge.map((k) => [k.id, k]))
  let totalScore = 0
  let count = 0

  for (const r of recent) {
    const kb = r.biomarker_id ? kbMap.get(r.biomarker_id) : null
    if (!kb) continue
    count++

    const { optimal_min, optimal_max, normal_min, normal_max } = kb
    if (optimal_min !== null && optimal_max !== null && r.value >= optimal_min && r.value <= optimal_max) {
      totalScore += 100
    } else if (normal_min !== null && normal_max !== null && r.value >= normal_min && r.value <= normal_max) {
      totalScore += 70
    } else {
      totalScore += 20
    }
  }

  return count > 0 ? Math.round(totalScore / count) : 30
}

// ─── Compliance ───────────────────────────────────────────────────────────────

function calcComplianceScore(prescriptions: Prescription[]): number {
  if (prescriptions.length === 0) return 100

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recent = prescriptions.filter((p) => new Date(p.created_at) > thirtyDaysAgo)
  if (recent.length === 0) return 100

  const completed = recent.filter((p) => p.status === 'completed').length
  return Math.round((completed / recent.length) * 100)
}

// ─── Level ────────────────────────────────────────────────────────────────────

export function scoreToLevel(score: number): string {
  if (score >= 85) return 'Platinum'
  if (score >= 70) return 'Gold'
  if (score >= 50) return 'Silver'
  return 'Bronze'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface ScoreInput {
  member: MemberProfile
  dailyMetrics: DailyMetric[]
  biomarkerResults: BiomarkerResult[]
  biomarkerKnowledge: BiomarkerKnowledge[]
  prescriptions: Prescription[]
}

export interface ScoreOutput {
  score: number
  level: string
  sleep_score: number
  recovery_score: number
  activity_score: number
  biomarker_score: number
  compliance_score: number
}

export function calculateScore(input: ScoreInput): ScoreOutput {
  const sleep = clamp(calcSleepScore(input.dailyMetrics, input.member))
  const recovery = clamp(calcRecoveryScore(input.dailyMetrics, input.member))
  const activity = clamp(calcActivityScore(input.dailyMetrics, input.member))
  const biomarker = clamp(calcBiomarkerScore(input.biomarkerResults, input.biomarkerKnowledge))
  const compliance = clamp(calcComplianceScore(input.prescriptions))

  const score = Math.round(
    sleep * WEIGHTS.sleep +
    recovery * WEIGHTS.recovery +
    activity * WEIGHTS.activity +
    biomarker * WEIGHTS.biomarker +
    compliance * WEIGHTS.compliance
  )

  return {
    score: clamp(score),
    level: scoreToLevel(score),
    sleep_score: sleep,
    recovery_score: recovery,
    activity_score: activity,
    biomarker_score: biomarker,
    compliance_score: compliance,
  }
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)))
}
