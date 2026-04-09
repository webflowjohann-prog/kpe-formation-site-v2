import type { APIRoute } from 'astro'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import { calculateScore, scoreToLevel } from '@/lib/score-calculator'
import type { DailyMetric, BiomarkerResult, BiomarkerKnowledge, Prescription, MemberProfile } from '@/lib/score-calculator'

const CRON_SECRET = import.meta.env.CRON_SECRET as string | undefined

export const POST: APIRoute = async ({ request, cookies }) => {
  const rawBody = await request.text()
  let body: { member_id?: string } = {}
  try { body = JSON.parse(rawBody) } catch {}

  const cronHeader = request.headers.get('x-cron-secret')
  const isCron = CRON_SECRET && cronHeader === CRON_SECRET

  let targetMemberIds: string[] = []

  if (isCron) {
    // Mode cron — calculer pour tous les membres actifs (ou un membre spécifique)
    const supabase = createAdminSupabase()
    if (body.member_id) {
      targetMemberIds = [body.member_id]
    } else {
      const { data } = await supabase
        .from('members')
        .select('id')
        .eq('onboarding_completed', true)
        .limit(500)
      targetMemberIds = (data ?? []).map((m: { id: string }) => m.id)
    }
  } else {
    // Mode utilisateur connecté — calculer uniquement pour lui-même
    const supabase = createServerSupabase(cookies)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    targetMemberIds = [body.member_id ?? user.id]
  }

  const supabase = createAdminSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const results: Array<{ member_id: string; score: number; level: string }> = []

  // Charger la knowledge base (partagée)
  const { data: knowledgeBase } = await supabase
    .from('biomarker_knowledge')
    .select('id, normal_min, normal_max, optimal_min, optimal_max')

  for (const memberId of targetMemberIds) {
    try {
      const [metricsRes, bioRes, presRes, memberRes] = await Promise.all([
        // daily_metrics 7 derniers jours
        supabase
          .from('daily_metrics')
          .select('date, sleep_duration_seconds, sleep_efficiency, deep_sleep_seconds, rem_sleep_seconds, hrv_rmssd, resting_hr, spo2_avg, steps, active_minutes, active_calories')
          .eq('member_id', memberId)
          .order('date', { ascending: false })
          .limit(30),
        // biomarker_results récents
        supabase
          .from('biomarker_results')
          .select('biomarker_id, value, measured_at')
          .eq('member_id', memberId)
          .order('measured_at', { ascending: false })
          .limit(50),
        // prescriptions (compliance 30j)
        supabase
          .from('agent_prescriptions')
          .select('status, created_at')
          .eq('member_id', memberId)
          .neq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(100),
        // profil membre
        supabase
          .from('members')
          .select('sleep_hours, sleep_quality, training_frequency, resting_hr')
          .eq('id', memberId)
          .single(),
      ])

      const scoreOutput = calculateScore({
        member: (memberRes.data ?? {}) as MemberProfile,
        dailyMetrics: (metricsRes.data ?? []) as DailyMetric[],
        biomarkerResults: (bioRes.data ?? []) as BiomarkerResult[],
        biomarkerKnowledge: (knowledgeBase ?? []) as BiomarkerKnowledge[],
        prescriptions: (presRes.data ?? []) as Prescription[],
      })

      // Upsert dans cortex_scores
      await supabase.from('cortex_scores').upsert(
        {
          member_id: memberId,
          score: scoreOutput.score,
          level: scoreOutput.level,
          sleep_score: scoreOutput.sleep_score,
          recovery_score: scoreOutput.recovery_score,
          activity_score: scoreOutput.activity_score,
          biomarker_score: scoreOutput.biomarker_score,
          compliance_score: scoreOutput.compliance_score,
          calculated_at: today,
        },
        { onConflict: 'member_id,calculated_at' }
      )

      // Mettre à jour members.cortex_score
      await supabase
        .from('members')
        .update({ cortex_score: scoreOutput.score })
        .eq('id', memberId)

      results.push({ member_id: memberId, score: scoreOutput.score, level: scoreOutput.level })
    } catch (err) {
      console.error(`[scores/calculate] Error for member ${memberId}:`, err)
    }
  }

  return new Response(
    JSON.stringify({ calculated: results.length, results }),
    { status: 200 }
  )
}
