-- Migration 008 — onboarding_responses + member_health_profiles
-- Les réponses onboarding ne vont plus directement dans members

-- ── onboarding_responses : stockage brut clé/valeur ─────────────────────────

CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  value JSONB,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, field)
);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_member_manage" ON public.onboarding_responses
  FOR ALL USING (auth.uid() = member_id) WITH CHECK (auth.uid() = member_id);

CREATE INDEX idx_onboarding_responses_member ON public.onboarding_responses(member_id);

-- ── member_health_profiles : profil de santé compilé typé ───────────────────

CREATE TABLE IF NOT EXISTS public.member_health_profiles (
  member_id UUID PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,

  -- Profil de base
  age INTEGER,
  gender TEXT,
  height_cm INTEGER,
  weight_kg DECIMAL(5,1),
  primary_goal TEXT,
  activity_level TEXT,
  health_conditions TEXT,
  medications TEXT[],
  health_tracking_level TEXT,

  -- FORGE — Entraînement
  sports TEXT[],
  training_frequency INTEGER,
  training_duration TEXT,
  performance_level TEXT,
  training_goal TEXT,
  recovery_rating INTEGER,
  equipment_access TEXT,
  has_coach BOOLEAN,
  injuries TEXT,
  recovery_speed TEXT,
  has_vo2_test BOOLEAN,
  resting_hr INTEGER,

  -- MORPHÉE — Sommeil
  sleep_hours DECIMAL(3,1),
  sleep_quality INTEGER,
  bedtime TEXT,
  wake_time TEXT,
  sleep_issues TEXT[],
  night_awakenings TEXT,
  morning_freshness INTEGER,
  sleep_aids TEXT[],
  has_evening_routine BOOLEAN,
  screen_time_evening TEXT,

  -- FUEL — Nutrition
  diet_type TEXT,
  meal_frequency INTEGER,
  food_allergies TEXT[],
  tracks_calories TEXT,
  hydration_liters DECIMAL(3,1),
  supplements TEXT[],
  post_meal_energy INTEGER,
  skips_meals TEXT,
  alcohol_consumption TEXT,
  caffeine_consumption TEXT,
  has_nutrition_assessment BOOLEAN,
  food_relationship TEXT,

  -- ZÉNITH — Mental
  stress_level INTEGER,
  stress_sources TEXT[],
  meditation_frequency TEXT,
  has_breathwork BOOLEAN,
  concentration_quality INTEGER,
  mood_general TEXT,
  mental_wellness_practices TEXT[],
  has_mental_health_professional TEXT,

  -- ATLAS — Expériences
  extreme_experience_interest INTEGER,
  experience_types TEXT[],
  has_expedition BOOLEAN,
  experience_fitness_level TEXT,
  experience_availability TEXT[],

  -- ORACLE — Données & Wearables
  has_wearable BOOLEAN,
  wearable_brand TEXT,
  has_blood_work BOOLEAN,
  biomarker_interest INTEGER,
  health_tracking_duration TEXT,
  knows_hrv BOOLEAN,
  health_apps TEXT[],
  referral_source TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.member_health_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_profile_member_read" ON public.member_health_profiles
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "health_profile_member_write" ON public.member_health_profiles
  FOR ALL USING (auth.uid() = member_id) WITH CHECK (auth.uid() = member_id);

-- Trigger updated_at
CREATE TRIGGER health_profiles_updated_at
  BEFORE UPDATE ON public.member_health_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
