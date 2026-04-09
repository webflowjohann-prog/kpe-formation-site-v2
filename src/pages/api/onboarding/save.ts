import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  // Construire le payload member — uniquement les colonnes connues
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

  const payload: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(answers ?? {})) {
    if (ALLOWED_FIELDS.has(key) && val !== null && val !== undefined && val !== '') {
      payload[key] = val
    }
  }

  if (completed) {
    payload.onboarding_completed = true
  }

  const { error } = await supabase
    .from('members')
    .update(payload)
    .eq('id', user.id)

  if (error) {
    console.error('[onboarding/save]', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
