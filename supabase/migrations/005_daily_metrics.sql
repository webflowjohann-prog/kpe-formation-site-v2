-- Migration 005 — Métriques quotidiennes wearable (Terra)

CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Activité
  steps INTEGER,
  active_calories INTEGER,
  total_calories INTEGER,
  distance_meters INTEGER,
  active_minutes INTEGER,

  -- Sommeil
  sleep_duration_seconds INTEGER,
  sleep_efficiency DECIMAL(5,2),
  deep_sleep_seconds INTEGER,
  rem_sleep_seconds INTEGER,
  light_sleep_seconds INTEGER,
  sleep_start_time TIMESTAMPTZ,
  sleep_end_time TIMESTAMPTZ,

  -- Récupération / Cardio
  hrv_rmssd DECIMAL(8,2),
  resting_hr INTEGER,
  spo2_avg DECIMAL(5,2),
  stress_score INTEGER,

  -- Meta
  provider TEXT,
  terra_raw JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT daily_metrics_member_date UNIQUE (member_id, date)
);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_select_own" ON public.daily_metrics
  FOR SELECT USING (auth.uid() = member_id);

CREATE INDEX idx_daily_metrics_member_date
  ON public.daily_metrics(member_id, date DESC);

CREATE TRIGGER daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
