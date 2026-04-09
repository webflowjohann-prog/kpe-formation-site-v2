-- Migration 003 — Conversations, partenaires, produits, commandes

-- ── Agent conversations ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_own" ON public.agent_conversations
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "conversations_insert_own" ON public.agent_conversations
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE INDEX idx_conversations_member_agent
  ON public.agent_conversations(member_id, agent, created_at DESC);

-- ── Partenaires ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'supplement',
  logo_url TEXT,
  description TEXT,
  commission_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  stripe_account_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS public read pour les membres connectés
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_read_all" ON public.partners
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── Produits ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  long_description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  category TEXT NOT NULL DEFAULT 'supplement',
  agent_tags TEXT[],
  dosage TEXT,
  image_url TEXT,
  stripe_price_id TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read_active" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated' AND active = true);

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_agent_tags ON public.products USING gin(agent_tags);

-- ── Commandes partenaires ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  total_cents INTEGER NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON public.partner_orders
  FOR SELECT USING (auth.uid() = member_id);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.partner_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Seed partenaires et produits (données exemple) ───────────────────────────
INSERT INTO public.partners (name, slug, category, description, commission_pct) VALUES
  ('Nutri-Premium', 'nutri-premium', 'supplement', 'Compléments alimentaires premium formulés pour la performance', 18.00),
  ('BioOptimize', 'biooptimize', 'supplement', 'Suppléments science-based pour la récupération et les biomarqueurs', 20.00),
  ('Organic Fuel', 'organic-fuel', 'food', 'Nutrition fonctionnelle et super-aliments certifiés bio', 15.00)
ON CONFLICT (slug) DO NOTHING;

-- Insérer les produits en récupérant l'ID du partenaire
WITH p AS (SELECT id FROM public.partners WHERE slug = 'nutri-premium')
INSERT INTO public.products (partner_id, name, slug, description, price_cents, category, agent_tags, dosage, featured)
SELECT
  p.id,
  name, slug, description, price_cents, category, agent_tags::TEXT[], dosage, featured
FROM p, (VALUES
  ('Magnésium Bisglycinate 300mg', 'magnesium-bisglycinate', 'Forme hautement biodisponible pour le sommeil, la récupération musculaire et la gestion du stress.', 2490, 'supplement', '{fuel,morphee,zenith}', '1 gélule le soir avec le repas', true),
  ('Oméga-3 EPA/DHA 1000mg', 'omega-3-epa-dha', 'Huile de poisson sauvage ultra-concentrée — anti-inflammatoire, cardio et cognitif.', 3490, 'supplement', '{fuel,oracle}', '2 gélules par jour avec un repas', true),
  ('Vitamine D3 + K2 5000 UI', 'vitamine-d3-k2', 'Duo synergique pour l'immunité, les os et la testostérone. Indispensable en déficit.', 1990, 'supplement', '{fuel,oracle}', '1 gélule par jour', false),
  ('Zinc Bisglycinate 25mg', 'zinc-bisglycinate', 'Zinc hautement assimilable pour la testostérone, l'immunité et la peau.', 1490, 'supplement', '{fuel}', '1 gélule par jour à jeun', false)
) AS v(name, slug, description, price_cents, category, agent_tags, dosage, featured)
ON CONFLICT DO NOTHING;

WITH p AS (SELECT id FROM public.partners WHERE slug = 'biooptimize')
INSERT INTO public.products (partner_id, name, slug, description, price_cents, category, agent_tags, dosage, featured)
SELECT
  p.id,
  name, slug, description, price_cents, category, agent_tags::TEXT[], dosage, featured
FROM p, (VALUES
  ('Créatine Monohydrate 300g', 'creatine-monohydrate', 'La crème des crèmes : créatine micronisée Creapure® pour force et hypertrophie.', 2990, 'supplement', '{fuel,forge}', '5g par jour, n''importe quand', true),
  ('Whey Protéine Isolate 900g', 'whey-isolate', 'Isolat de protéines de lactosérum ultra-pur, 90% protéines, sans lactose.', 5490, 'supplement', '{fuel,forge}', '1 dose post-entraînement', true),
  ('Ashwagandha KSM-66 600mg', 'ashwagandha-ksm66', 'Extrait breveté d'ashwagandha — cortisol, stress, testostérone, sommeil.', 2790, 'supplement', '{fuel,zenith,morphee}', '1 gélule matin ou soir', false),
  ('Coenzyme Q10 200mg', 'coenzyme-q10', 'Antioxydant mitochondrial — énergie cellulaire, récupération et cardio.', 3290, 'supplement', '{fuel,oracle}', '1 gélule par jour avec un repas gras', false)
) AS v(name, slug, description, price_cents, category, agent_tags, dosage, featured)
ON CONFLICT DO NOTHING;
