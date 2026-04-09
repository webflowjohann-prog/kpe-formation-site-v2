-- Migration 004 — Biomarqueurs : knowledge base + résultats scanner

-- ── Biomarker knowledge base ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.biomarker_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'blood',
  standard_unit TEXT,
  normal_min DECIMAL,
  normal_max DECIMAL,
  optimal_min DECIMAL,
  optimal_max DECIMAL,
  unit_alternatives TEXT[] DEFAULT '{}',
  description TEXT,
  agents TEXT[] DEFAULT '{oracle,fuel}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.biomarker_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bk_read_authenticated" ON public.biomarker_knowledge
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── Biomarker results (OCR / manual) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.biomarker_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  biomarker_id UUID REFERENCES public.biomarker_knowledge(id),
  raw_name TEXT,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'scanner',
  confidence DECIMAL CHECK (confidence BETWEEN 0 AND 1),
  status TEXT NOT NULL DEFAULT 'validated',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.biomarker_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "br_select_own" ON public.biomarker_results
  FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "br_insert_own" ON public.biomarker_results
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE INDEX idx_biomarker_results_member
  ON public.biomarker_results(member_id, measured_at DESC);

-- ── Seed knowledge base ───────────────────────────────────────────────────────
INSERT INTO public.biomarker_knowledge (name, aliases, category, standard_unit, normal_min, normal_max, optimal_min, optimal_max, agents) VALUES
-- Vitamines
('Vitamine D', ARRAY['25-OH Vitamine D','25(OH)D','Calcidiol','Vit D','VitD','Vitamin D'], 'vitamine', 'nmol/L', 50, 200, 100, 150, ARRAY['fuel','oracle']),
('Vitamine B12', ARRAY['Cobalamine','Cyanocobalamine','Vit B12','B12'], 'vitamine', 'pmol/L', 145, 637, 300, 500, ARRAY['fuel','oracle']),
('Folates', ARRAY['Vitamine B9','Acide folique','B9','Folate sérique'], 'vitamine', 'nmol/L', 7, 45, 15, 35, ARRAY['fuel','oracle']),

-- Minéraux
('Magnésium', ARRAY['Mg','Magnésium sérique','Magnesium'], 'mineral', 'mmol/L', 0.75, 0.95, 0.85, 0.95, ARRAY['fuel','morphee']),
('Zinc', ARRAY['Zn','Zinc sérique','Zinc plasmatique'], 'mineral', 'μmol/L', 10, 18, 13, 18, ARRAY['fuel','oracle']),
('Fer', ARRAY['Fe','Fer sérique','Sidérémie','Iron'], 'mineral', 'μmol/L', 10, 30, 15, 25, ARRAY['fuel','oracle']),
('Ferritine', ARRAY['Ferritin','Ferritine sérique'], 'mineral', 'μg/L', 15, 200, 50, 150, ARRAY['fuel','oracle']),

-- Bilan lipidique
('Cholestérol total', ARRAY['Cholesterol','CT','Total cholesterol','Chol total'], 'lipid', 'mmol/L', 0, 5.2, 3.5, 5.0, ARRAY['fuel','oracle']),
('LDL', ARRAY['LDL-cholestérol','LDL cholesterol','LDL-C','Low density lipoprotein'], 'lipid', 'mmol/L', 0, 3.0, 1.5, 2.5, ARRAY['fuel','oracle']),
('HDL', ARRAY['HDL-cholestérol','HDL cholesterol','HDL-C','High density lipoprotein'], 'lipid', 'mmol/L', 1.0, 5.0, 1.5, 3.0, ARRAY['fuel','oracle']),
('Triglycérides', ARRAY['TG','Triglycerides','Triglycéridémie'], 'lipid', 'mmol/L', 0, 1.7, 0.5, 1.2, ARRAY['fuel','oracle']),

-- Hormones
('Testostérone totale', ARRAY['Testostérone','Testosterone','T totale','Total testosterone'], 'hormone', 'nmol/L', 9.0, 35.0, 18.0, 30.0, ARRAY['forge','oracle']),
('Cortisol', ARRAY['Cortisol matinal','Cortisol sérique','Hydrocortisone'], 'hormone', 'nmol/L', 170, 530, 200, 450, ARRAY['zenith','oracle']),
('TSH', ARRAY['Thyréostimuline','Thyroid stimulating hormone','TSH ultrasensible'], 'hormone', 'mUI/L', 0.4, 4.0, 0.5, 2.5, ARRAY['oracle']),
('DHEA-S', ARRAY['DHEA sulfate','Déhydroépiandrostérone','DHEA-SO4'], 'hormone', 'μmol/L', 2.0, 13.5, 5.0, 12.0, ARRAY['forge','oracle']),
('IGF-1', ARRAY['Insulin-like growth factor','Somatomédine C','IGF1'], 'hormone', 'nmol/L', 16, 32, 20, 30, ARRAY['forge','oracle']),

-- Glycémie / métabolisme
('HbA1c', ARRAY['Hémoglobine glyquée','Glycosylated hemoglobin','A1C','HbA1C'], 'metabolic', '%', 0, 5.7, 4.5, 5.3, ARRAY['fuel','oracle']),
('Glycémie à jeun', ARRAY['Glucose à jeun','Glucose','Blood glucose','Glycémie'], 'metabolic', 'mmol/L', 3.9, 5.5, 4.0, 5.0, ARRAY['fuel','oracle']),
('Insuline à jeun', ARRAY['Insuline','Insulin','Insulinémie'], 'metabolic', 'pmol/L', 20, 130, 20, 60, ARRAY['fuel','oracle']),

-- Inflammation / reins
('CRP ultra-sensible', ARRAY['CRP us','CRP hs','C-reactive protein','Protéine C réactive','CRP'], 'inflammation', 'mg/L', 0, 3.0, 0, 1.0, ARRAY['oracle']),
('Créatinine', ARRAY['Creatinine','Creatinin','Créatininémie'], 'renal', 'μmol/L', 60, 115, 70, 100, ARRAY['oracle']),
('Urée', ARRAY['Blood urea nitrogen','BUN','Urée sanguine'], 'renal', 'mmol/L', 2.5, 7.5, 3.0, 6.5, ARRAY['oracle']),

-- NFS
('Hémoglobine', ARRAY['Hb','Hemoglobin','Hgb','Taux d hémoglobine'], 'blood_count', 'g/dL', 13.0, 17.0, 14.0, 16.5, ARRAY['oracle']),
('Hématocrite', ARRAY['Ht','Hematocrit','PCV'], 'blood_count', '%', 40, 50, 42, 48, ARRAY['oracle']),
('Vitesse de sédimentation', ARRAY['VS','ESR','Sedimentation rate'], 'inflammation', 'mm/h', 0, 15, 0, 10, ARRAY['oracle'])
ON CONFLICT DO NOTHING;
