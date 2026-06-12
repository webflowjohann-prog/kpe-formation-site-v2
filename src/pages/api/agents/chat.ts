import type { APIRoute } from 'astro'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude'
import { buildSystemPrompt } from '@/lib/agent-prompts'
import type { AgentId, MemberContext, ConversationContext } from '@/lib/agent-prompts'

const VALID_AGENTS: AgentId[] = ['forge', 'morphee', 'fuel', 'zenith', 'atlas', 'oracle']

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { agent: string; message: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { agent, message } = body
  if (!agent || !VALID_AGENTS.includes(agent as AgentId)) {
    return new Response(JSON.stringify({ error: 'Invalid agent' }), { status: 400 })
  }
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 })
  }

  const agentId = agent as AgentId
  const isAutoBriefing = message === 'BRIEFING_AUTO'

  // ── Chargement parallèle de toutes les données contextuelles ─────────────
  // Promise.allSettled : une requête qui échoue ne crashe pas les autres
  const [memberRes, healthRes, prescRes, metricsRes, bioRes, bioKbRes, historyRes] = await Promise.allSettled([
    // Profil de base (membres)
    supabase
      .from('members')
      .select('full_name, cortex_score')
      .eq('id', user.id)
      .single(),

    // Profil de santé complet
    supabase
      .from('member_health_profiles')
      .select(`
        age, gender, height_cm, weight_kg,
        primary_goal, activity_level, health_conditions, medications, health_tracking_level,
        sports, training_frequency, training_duration, performance_level, training_goal,
        recovery_rating, equipment_access, has_coach, injuries, recovery_speed, resting_hr,
        sleep_hours, sleep_quality, bedtime, wake_time, sleep_issues, morning_freshness,
        sleep_aids, has_evening_routine, screen_time_evening,
        diet_type, meal_frequency, food_allergies, tracks_calories, hydration_liters,
        supplements, post_meal_energy, skips_meals, alcohol_consumption, caffeine_consumption,
        stress_level, stress_sources, meditation_frequency, has_breathwork,
        concentration_quality, mood_general, mental_wellness_practices,
        has_wearable, wearable_brand, has_blood_work, biomarker_interest, knows_hrv
      `)
      .eq('member_id', user.id)
      .single(),

    // Prescriptions actives
    supabase
      .from('agent_prescriptions')
      .select('agent, type, title, description, timing')
      .eq('member_id', user.id)
      .eq('status', 'active')
      .limit(10),

    // Métriques wearable 7 derniers jours
    supabase
      .from('daily_metrics')
      .select('date, hrv_rmssd, resting_hr, spo2_avg, steps, active_minutes, active_calories, sleep_duration_seconds, deep_sleep_seconds, rem_sleep_seconds, sleep_efficiency')
      .eq('member_id', user.id)
      .order('date', { ascending: false })
      .limit(7),

    // Résultats biomarqueurs récents (30 derniers)
    supabase
      .from('biomarker_results')
      .select('biomarker_id, value, unit, measured_at')
      .eq('member_id', user.id)
      .order('measured_at', { ascending: false })
      .limit(30),

    // Knowledge base biomarqueurs (pour résoudre les noms)
    supabase
      .from('biomarker_knowledge')
      .select('id, name, category, normal_min, normal_max, optimal_min, optimal_max'),

    // Historique conversation (ordre DESC pour limit, reversed ensuite)
    supabase
      .from('agent_conversations')
      .select('role, content')
      .eq('member_id', user.id)
      .eq('agent', agentId)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  // ── Extraction des résultats (allSettled) ────────────────────────────────
  function ok<T>(r: PromiseSettledResult<{ data: T | null }>): T | null {
    if (r.status === 'rejected') {
      console.error('[agents/chat] Query failed:', r.reason)
      return null
    }
    return r.value.data
  }

  const memberData  = ok(memberRes)
  const healthData  = ok(healthRes)
  const prescData   = ok(prescRes)
  const metricsData = ok(metricsRes)
  const bioData     = ok(bioRes)
  const bioKbData   = ok(bioKbRes)
  const historyData = ok(historyRes)

  // ── Fusion profil membre ──────────────────────────────────────────────────
  const member = {
    ...(memberData ?? {}),
    ...(healthData ?? {}),
  } as MemberContext

  // ── Prescriptions actives ─────────────────────────────────────────────────
  const activePrescriptions = (prescData ?? [])
    .map((p) => `[${p.agent.toUpperCase()}] ${p.type}: ${p.title} — ${p.description ?? ''} (${p.timing ?? ''})`)
    .join('\n') || 'Aucune prescription active.'

  // ── Métriques wearable formatées ──────────────────────────────────────────
  const metrics = metricsData ?? []
  const recentMetrics = metrics.length > 0
    ? metrics.map((m) => {
        const parts: string[] = [m.date]
        if (m.hrv_rmssd)              parts.push(`HRV ${m.hrv_rmssd} ms`)
        if (m.resting_hr)             parts.push(`FC repos ${m.resting_hr} bpm`)
        if (m.spo2_avg)               parts.push(`SpO2 ${m.spo2_avg}%`)
        if (m.steps)                  parts.push(`${m.steps} pas`)
        if (m.active_minutes)         parts.push(`${m.active_minutes} min actives`)
        if (m.sleep_duration_seconds) {
          const h = (m.sleep_duration_seconds / 3600).toFixed(1)
          parts.push(`Sommeil ${h}h`)
        }
        if (m.deep_sleep_seconds) {
          const d = Math.round(m.deep_sleep_seconds / 60)
          parts.push(`Profond ${d} min`)
        }
        if (m.rem_sleep_seconds) {
          const r = Math.round(m.rem_sleep_seconds / 60)
          parts.push(`REM ${r} min`)
        }
        if (m.sleep_efficiency)       parts.push(`Efficacité ${m.sleep_efficiency}%`)
        return parts.join(' | ')
      }).join('\n')
    : 'Aucune donnée wearable synchronisée.'

  // ── Biomarqueurs avec noms résolus ────────────────────────────────────────
  const kbMap = new Map(
    (bioKbData ?? []).map((kb) => [kb.id, kb])
  )
  const bioResults = bioData ?? []
  const recentBiomarkers = bioResults.length > 0
    ? bioResults.map((b) => {
        const kb = b.biomarker_id ? kbMap.get(b.biomarker_id) : null
        const name     = kb?.name ?? b.biomarker_id ?? 'Inconnu'
        const category = kb?.category ?? ''
        const date     = b.measured_at?.slice(0, 10) ?? ''
        let status = ''
        if (kb && b.value !== null) {
          if (kb.optimal_min !== null && kb.optimal_max !== null && b.value >= kb.optimal_min && b.value <= kb.optimal_max) {
            status = ' ✓ Optimal'
          } else if (kb.normal_min !== null && b.value < kb.normal_min) {
            status = ' ↓ Bas'
          } else if (kb.normal_max !== null && b.value > kb.normal_max) {
            status = ' ↑ Élevé'
          } else {
            status = ' — Normal'
          }
        }
        return `${name} (${category}): ${b.value} ${b.unit ?? ''}${status} [${date}]`
      }).join('\n')
    : 'Aucun bilan scanner disponible.'

  // ── Catalogue produits & expériences (adminSupabase — bypass RLS) ──────────
  const adminSupabase = createAdminSupabase()
  const [productsRes, experiencesRes] = await Promise.allSettled([
    adminSupabase
      .from('partner_products')
      .select('id, name, description, price, prescribing_agent, linked_biomarkers, product_url, image_url, partners(name)')
      .eq('active', true),
    adminSupabase
      .from('experience_catalog')
      .select('id, title, short_desc, location, category, date_start, date_end, price_cents, min_oracle_score, spots_remaining, status')
      .in('status', ['open', 'upcoming']),
  ])
  const allProducts = productsRes.status === 'fulfilled' ? (productsRes.value.data ?? []) : []
  const allExperiences = experiencesRes.status === 'fulfilled' ? (experiencesRes.value.data ?? []) : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentProducts = allProducts.filter((p: any) => p.prescribing_agent === agentId)

  const agentProductsJson = JSON.stringify(agentProducts, null, 2)
  const allExperiencesJson = JSON.stringify(allExperiences, null, 2)

  // ── Contexte conversation ─────────────────────────────────────────────────
  const ctx: ConversationContext = {
    member,
    activePrescriptions,
    recentMetrics,
    recentBiomarkers,
    agentProducts: agentProductsJson,
    allExperiences: allExperiencesJson,
  }

  const systemPrompt = buildSystemPrompt(agentId, ctx)

  // ── Historique (ordre chronologique) ─────────────────────────────────────
  const historyMessages = (historyData ?? []).reverse().map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // ── Sauvegarde message utilisateur (sauf auto-briefing) ──────────────────
  if (!isAutoBriefing) {
    await supabase.from('agent_conversations').insert({
      member_id: user.id,
      agent: agentId,
      role: 'user',
      content: message,
    })
  }

  // ── Appel Claude API ──────────────────────────────────────────────────────
  const briefingInstruction = isAutoBriefing
    ? '\n\nMODE BRIEFING AUTO : Le membre vient d\'arriver sur ta page. Génère immédiatement un briefing personnalisé et proactif basé sur toutes ses données. Commence directement par l\'analyse sans introduction. Sois concis, actionnable, et prescris si pertinent.'
    : ''
  const claudeMessages = isAutoBriefing
    ? [{ role: 'user' as const, content: 'Génère mon briefing maintenant.' }]
    : [...historyMessages, { role: 'user' as const, content: message }]

  const claude = getClaudeClient()
  const claudeResponse = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt + briefingInstruction,
    messages: claudeMessages,
  })

  const responseText = claudeResponse.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('')

  // ── Sauvegarde réponse agent ──────────────────────────────────────────────
  await supabase.from('agent_conversations').insert({
    member_id: user.id,
    agent: agentId,
    role: 'assistant',
    content: responseText,
  })

  // ── Parse prescription ────────────────────────────────────────────────────
  const prescriptionMatch = responseText.match(/```prescription\s*([\s\S]*?)```/)
  let newPrescription: Record<string, string> | null = null

  if (prescriptionMatch) {
    try {
      const parsed = JSON.parse(prescriptionMatch[1].trim())
      await supabase.from('agent_prescriptions').insert({
        member_id: user.id,
        agent: agentId,
        type: parsed.type ?? 'nutrition',
        title: parsed.title ?? 'Prescription',
        description: parsed.description,
        timing: parsed.timing,
        duration: parsed.duration,
        priority: parsed.priority ?? 'medium',
        status: 'active',
      })
      newPrescription = parsed
    } catch {
      // JSON malformé — ignore
    }
  }

  const cleanResponse = responseText.replace(/```prescription[\s\S]*?```/g, '').trim()

  return new Response(
    JSON.stringify({ response: cleanResponse, prescription: newPrescription }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
