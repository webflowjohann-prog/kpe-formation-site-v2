import type { APIRoute } from 'astro'
import { createAdminSupabase } from '@/lib/supabase'
import { verifyTerraSignature } from '@/lib/terra'
import type {
  TerraWebhookPayload,
  TerraActivityData,
  TerraSleepData,
  TerraBodyData,
  TerraDailyData,
} from '@/lib/terra'

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text()
  const sig = request.headers.get('terra-signature')

  if (!verifyTerraSignature(rawBody, sig)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let payload: TerraWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const supabase = createAdminSupabase()

  // Trouver le membre via terra_user_id
  let memberId: string | null = null

  if (payload.type === 'auth') {
    // Nouveau device connecté — stocker le terra_user_id
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('terra_user_id', payload.user.user_id)
      .maybeSingle()

    // Si pas trouvé par terra_user_id, essayer via reference_id (= member UUID)
    if (!member) {
      // Le reference_id est passé lors de la création de la session widget
      // Terra le renvoie dans l'auth payload (certaines versions)
      console.info('[terra/webhook] New auth — terra_user_id:', payload.user.user_id)
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  // Pour les autres types, récupérer le membre par terra_user_id
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('terra_user_id', payload.user.user_id)
    .maybeSingle()

  if (!member) {
    console.warn('[terra/webhook] Member not found for terra_user_id:', payload.user.user_id)
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  memberId = member.id

  const date = new Date(payload.user.last_webhook_update).toISOString().slice(0, 10)

  const metrics: Record<string, unknown> = {
    member_id: memberId,
    date,
    provider: payload.user.provider,
    terra_raw: payload.data ?? null,
  }

  // ── Activity ──────────────────────────────────────────────────────────────
  if (payload.type === 'activity' && Array.isArray(payload.data)) {
    for (const d of payload.data as TerraActivityData[]) {
      const actDate = d.metadata?.start_time?.slice(0, 10) ?? date
      await supabase.from('daily_metrics').upsert({
        member_id: memberId,
        date: actDate,
        provider: payload.user.provider,
        active_calories: d.calories_data?.active_calories ?? null,
        total_calories: d.calories_data?.total_burned_calories ?? null,
        steps: d.distance_data?.summary?.steps ?? null,
        distance_meters: d.distance_data?.summary?.distance_meters ?? null,
        active_minutes: d.active_durations_data?.activity_seconds
          ? Math.round(d.active_durations_data.activity_seconds / 60)
          : null,
        resting_hr: d.heart_rate_data?.summary?.resting_hr_bpm ?? null,
        hrv_rmssd: d.heart_rate_data?.summary?.avg_hrv_rmssd ?? null,
      }, { onConflict: 'member_id,date' })
    }
  }

  // ── Sleep ─────────────────────────────────────────────────────────────────
  if (payload.type === 'sleep' && Array.isArray(payload.data)) {
    for (const d of payload.data as TerraSleepData[]) {
      const sleepDate = d.metadata?.start_time?.slice(0, 10) ?? date
      const asleep = d.sleep_durations_data?.asleep_durations
      const totalSeconds =
        (asleep?.duration_light_sleep_state_seconds ?? 0) +
        (asleep?.duration_REM_sleep_state_seconds ?? 0) +
        (asleep?.duration_deep_sleep_state_seconds ?? 0)

      await supabase.from('daily_metrics').upsert({
        member_id: memberId,
        date: sleepDate,
        provider: payload.user.provider,
        sleep_duration_seconds: totalSeconds || null,
        sleep_efficiency: d.sleep_durations_data?.sleep_efficiency ?? null,
        deep_sleep_seconds: asleep?.duration_deep_sleep_state_seconds ?? null,
        rem_sleep_seconds: asleep?.duration_REM_sleep_state_seconds ?? null,
        light_sleep_seconds: asleep?.duration_light_sleep_state_seconds ?? null,
        sleep_start_time: d.metadata?.start_time ?? null,
        sleep_end_time: d.metadata?.end_time ?? null,
        hrv_rmssd: d.hrv_data?.summary?.rmssd_sample_mean_ms ?? null,
        resting_hr: d.heart_rate_data?.summary?.resting_hr_bpm ?? d.heart_rate_data?.summary?.min_hr_bpm ?? null,
        spo2_avg: d.oxygen_data?.avg_saturation_percentage ?? null,
      }, { onConflict: 'member_id,date' })
    }
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  if (payload.type === 'body' && Array.isArray(payload.data)) {
    for (const d of payload.data as TerraBodyData[]) {
      const bodyDate = d.metadata?.start_time?.slice(0, 10) ?? date
      await supabase.from('daily_metrics').upsert({
        member_id: memberId,
        date: bodyDate,
        provider: payload.user.provider,
        resting_hr: d.heart_rate_data?.summary?.resting_hr_bpm ?? null,
        hrv_rmssd: d.hrv_data?.summary?.rmssd_sample_mean_ms ?? null,
        spo2_avg: d.oxygen_data?.avg_saturation_percentage ?? null,
      }, { onConflict: 'member_id,date' })
    }
  }

  // ── Daily ─────────────────────────────────────────────────────────────────
  if (payload.type === 'daily' && Array.isArray(payload.data)) {
    for (const d of payload.data as TerraDailyData[]) {
      const dailyDate = d.metadata?.start_time?.slice(0, 10) ?? date
      await supabase.from('daily_metrics').upsert({
        member_id: memberId,
        date: dailyDate,
        provider: payload.user.provider,
        steps: d.steps_data?.steps ?? null,
        total_calories: d.calories_data?.total_burned_calories ?? null,
        active_calories: d.calories_data?.net_activity_calories ?? null,
        active_minutes: d.active_durations_data?.activity_seconds
          ? Math.round(d.active_durations_data.activity_seconds / 60)
          : null,
        distance_meters: d.distance_data?.summary?.distance_meters ?? null,
      }, { onConflict: 'member_id,date' })
    }
  }

  // Mettre à jour last_sync
  await supabase
    .from('members')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', memberId)

  // Déclencher le recalcul du score (appel interne)
  try {
    await fetch(`${import.meta.env.PUBLIC_SITE_URL}/api/scores/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': import.meta.env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({ member_id: memberId }),
    })
  } catch {
    // Non-bloquant
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
