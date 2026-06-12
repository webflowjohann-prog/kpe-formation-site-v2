-- Migration 009 — Corrections de schéma + backfill member_health_profiles
-- 1. Corrige le type de medications (TEXT[] → TEXT, car c'est une saisie libre)
-- 2. Backfill depuis members pour les membres déjà onboardés

-- ── Correction du type medications ─────────────────────────────────────────
ALTER TABLE public.member_health_profiles
  ALTER COLUMN medications TYPE TEXT USING array_to_string(medications, ', ');

-- ── Backfill depuis members → member_health_profiles ───────────────────────
-- Pour les membres qui ont complété l'onboarding avant migration 008
-- members.medications est TEXT[] → concaténer en TEXT
-- members.has_coach / has_vo2_test / etc. sont déjà BOOLEAN dans members

INSERT INTO public.member_health_profiles (
  member_id,
  age, gender, height_cm, weight_kg,
  primary_goal, activity_level, health_conditions,
  medications, health_tracking_level,
  sports, training_frequency, training_duration, performance_level, training_goal,
  recovery_rating, equipment_access, has_coach, injuries, recovery_speed,
  has_vo2_test, resting_hr,
  sleep_hours, sleep_quality, bedtime, wake_time, sleep_issues,
  night_awakenings, morning_freshness, sleep_aids, has_evening_routine, screen_time_evening,
  diet_type, meal_frequency, food_allergies, tracks_calories, hydration_liters,
  supplements, post_meal_energy, skips_meals, alcohol_consumption, caffeine_consumption,
  has_nutrition_assessment, food_relationship,
  stress_level, stress_sources, meditation_frequency, has_breathwork,
  concentration_quality, mood_general, mental_wellness_practices, has_mental_health_professional,
  extreme_experience_interest, experience_types, has_expedition,
  experience_fitness_level, experience_availability,
  has_wearable, wearable_brand, has_blood_work, biomarker_interest,
  health_tracking_duration, knows_hrv, health_apps, referral_source
)
SELECT
  id,
  age, gender, height_cm, weight_kg,
  primary_goal, activity_level, health_conditions,
  array_to_string(medications, ', '), health_tracking_level,
  sports, training_frequency, training_duration, performance_level, training_goal,
  recovery_rating, equipment_access, has_coach, injuries, recovery_speed,
  has_vo2_test, resting_hr,
  sleep_hours, sleep_quality, bedtime, wake_time, sleep_issues,
  night_awakenings, morning_freshness, sleep_aids, has_evening_routine, screen_time_evening,
  diet_type, meal_frequency, food_allergies, tracks_calories, hydration_liters,
  supplements, post_meal_energy, skips_meals, alcohol_consumption, caffeine_consumption,
  has_nutrition_assessment, food_relationship,
  stress_level, stress_sources, meditation_frequency, has_breathwork,
  concentration_quality, mood_general, mental_wellness_practices, has_mental_health_professional,
  extreme_experience_interest, experience_types, has_expedition,
  experience_fitness_level, experience_availability,
  has_wearable, wearable_brand, has_blood_work, biomarker_interest,
  health_tracking_duration, knows_hrv, health_apps, referral_source
FROM public.members
WHERE onboarding_completed = true
ON CONFLICT (member_id) DO NOTHING;

-- ── Vérification ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM public.member_health_profiles;
  RAISE NOTICE 'member_health_profiles contient % enregistrement(s)', n;
END;
$$;
