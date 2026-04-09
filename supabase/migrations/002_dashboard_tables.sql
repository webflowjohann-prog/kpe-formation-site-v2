-- Migration 002 — Dashboard : prescriptions, scores, briefs, alertes

-- ── Agent prescriptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  timing TEXT,
  duration TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescriptions_select_own" ON public.agent_prescriptions
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "prescriptions_update_own" ON public.agent_prescriptions
  FOR UPDATE USING (auth.uid() = member_id);

CREATE INDEX idx_prescriptions_member_status
  ON public.agent_prescriptions(member_id, status);

CREATE TRIGGER prescriptions_updated_at
  BEFORE UPDATE ON public.agent_prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Cortex scores ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cortex_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  level TEXT NOT NULL DEFAULT 'Bronze',
  sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
  recovery_score INTEGER CHECK (recovery_score BETWEEN 0 AND 100),
  activity_score INTEGER CHECK (activity_score BETWEEN 0 AND 100),
  biomarker_score INTEGER CHECK (biomarker_score BETWEEN 0 AND 100),
  compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
  calculated_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cortex_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_select_own" ON public.cortex_scores
  FOR SELECT USING (auth.uid() = member_id);

CREATE INDEX idx_cortex_scores_member_date
  ON public.cortex_scores(member_id, calculated_at DESC);

-- ── Daily briefs (ORACLE) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  priorities TEXT[],
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "briefs_select_own" ON public.daily_briefs
  FOR SELECT USING (auth.uid() = member_id);

CREATE UNIQUE INDEX idx_daily_briefs_member_date
  ON public.daily_briefs(member_id, brief_date);

-- ── Agent alerts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_own" ON public.agent_alerts
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "alerts_update_own" ON public.agent_alerts
  FOR UPDATE USING (auth.uid() = member_id);

CREATE INDEX idx_alerts_member_read
  ON public.agent_alerts(member_id, read, created_at DESC);
