-- Migration 001 — Table members (profil complet post-onboarding)
-- Run: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  cortex_score INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,

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

  -- Terra integration
  terra_user_id TEXT,
  last_sync TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_own" ON public.members
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "members_insert_own" ON public.members
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "members_update_own" ON public.members
  FOR UPDATE USING (auth.uid() = id);

-- Auto updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
