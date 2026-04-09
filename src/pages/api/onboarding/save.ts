import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'

// Seuls ces champs remontent directement dans members
const MEMBERS_DIRECT = new Set(['full_name'])

// Champs valides issus de questions.ts — écrits dans onboarding_responses
const ALLOWED_FIELDS = new Set([
  'full_name', 'age', 'gender', 'height_cm', 'weight_kg',
  'primary_goal', 'activity_level', 'health_conditions', 'medications', 'health_tracking_level',
  'sports', 'training_frequency', 'training_duration', 'performance_level', 'training_goal',
  'recovery_rating', 'equipment_access', 'has_coach', 'injuries', 'recovery_speed',
  'has_vo2_test', 'resting_hr',
  'sleep_hours', 'sleep_quality', 'bedtime', 'wake_time', 'sleep_issues',
  'night_awakenings', 'morning_freshness', 'sleep_aids', 'has_evening_routine', 'screen_time_evening',
  'diet_type', 'meal_frequency', 'food_allergies', 'tracks_calories', 'hydration_liters',
  'supplements', 'post_meal_energy', 'skips_meals', 'alcohol_consumption', 'caffeine_consumption',
  'has_nutrition_assessment', 'food_relationship',
  'stress_level', 'stress_sources', 'meditation_frequency', 'has_breathwork',
  'concentration_quality', 'mood_general', 'mental_wellness_practices', 'has_mental_health_professional',
  'extreme_experience_interest', 'experience_types', 'has_expedition',
  'experience_fitness_level', 'experience_availability',
  'has_wearable', 'wearable_brand', 'has_blood_work', 'biomarker_interest',
  'health_tracking_duration', 'knows_hrv', 'health_apps', 'referral_source',
])

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)

  let user: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return new Response(JSON.stringify({ error: 'Auth error' }), { status: 401 })
  }

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { answers, completed } = body as {
    answers: Record<string, unknown>
    completed?: boolean
  }

  const membersPayload: Record<string, unknown> = {}

  for (const [field, val] of Object.entries(answers ?? {})) {
    if (!ALLOWED_FIELDS.has(field) || val === null || val === undefined || val === '') continue

    // 1. Stocker dans onboarding_responses (brut)
    const { error: upsertErr } = await supabase
      .from('onboarding_responses')
      .upsert({ member_id: user.id, field, value: val }, { onConflict: 'member_id,field' })

    if (upsertErr) {
      console.error('[onboarding/save] onboarding_responses upsert error:', upsertErr)
    }

    // 2. Propager full_name directement dans members
    if (MEMBERS_DIRECT.has(field)) {
      membersPayload[field] = val
    }
  }

  // Mettre à jour members.full_name si présent
  if (Object.keys(membersPayload).length > 0) {
    await supabase.from('members').update(membersPayload).eq('id', user.id)
  }

  // Sur completion : compiler toutes les réponses → member_health_profiles
  if (completed) {
    const { data: allResponses } = await supabase
      .from('onboarding_responses')
      .select('field, value')
      .eq('member_id', user.id)

    if (allResponses && allResponses.length > 0) {
      const profile: Record<string, unknown> = { member_id: user.id }
      for (const { field, value } of allResponses) {
        if (field !== 'full_name') {
          profile[field] = value
        }
      }

      await supabase
        .from('member_health_profiles')
        .upsert(profile, { onConflict: 'member_id' })
    }

    // Marquer onboarding terminé
    await supabase
      .from('members')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
