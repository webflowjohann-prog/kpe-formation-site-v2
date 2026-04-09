-- ── Experiences ──────────────────────────────────────────────────────────────

create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_desc text,
  description text,
  location text not null,
  country text not null,
  category text not null check (category in ('altitude', 'polar', 'desert', 'sea', 'jungle', 'urban')),
  date_start date,
  date_end date,
  duration_days int,
  capacity int not null default 12,
  spots_remaining int not null default 12,
  price_cents int not null default 0,
  min_oracle_score int default 0,
  min_hrv numeric(5,1),
  image_url text,
  status text not null default 'upcoming' check (status in ('upcoming', 'open', 'full', 'confirmed', 'past')),
  biomarker_requirements jsonb default '[]'::jsonb,
  prep_weeks int default 8,
  created_at timestamptz default now()
);

alter table experiences enable row level security;
create policy "experiences_public_read" on experiences for select using (true);

-- ── Experience bookings ───────────────────────────────────────────────────────

create table if not exists experience_bookings (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  stripe_session_id text,
  stripe_payment_intent text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'refunded')),
  amount_cents int,
  booked_at timestamptz default now(),
  confirmed_at timestamptz,
  unique(member_id, experience_id)
);

alter table experience_bookings enable row level security;
create policy "bookings_member_read" on experience_bookings for select using (auth.uid() = member_id);
create policy "bookings_member_insert" on experience_bookings for insert with check (auth.uid() = member_id);

create index idx_experience_bookings_member on experience_bookings(member_id);
create index idx_experience_bookings_experience on experience_bookings(experience_id);

-- ── Seed : 4 expériences ─────────────────────────────────────────────────────

insert into experiences (title, short_desc, description, location, country, category, date_start, date_end, duration_days, capacity, spots_remaining, price_cents, min_oracle_score, min_hrv, status, prep_weeks, biomarker_requirements) values

(
  'Aconcagua — Sommet des Amériques',
  'Atteindre le plus haut sommet des Amériques à 6 962 m. Une expédition réservée aux profils biométriques d''élite.',
  'L''Aconcagua (6 962 m) est le toit de l''hémisphère occidental. Cette expédition de 21 jours exige une préparation cardiovasculaire et biométrique rigoureuse. ATLAS vérifie votre éligibilité et vous prépare sur 12 semaines avec des protocoles d''acclimatation progressifs.',
  'Parc Provincial Aconcagua',
  'Argentine',
  'altitude',
  '2026-07-15',
  '2026-08-05',
  21,
  8,
  5,
  490000,
  75,
  55.0,
  'open',
  12,
  '[{"biomarker": "VO2 max", "min_value": 45, "description": "Capacité aérobique minimale requise"}, {"biomarker": "Hématocrite", "min_value": 40, "description": "Oxygénation du sang"}, {"biomarker": "Ferritine", "min_value": 60, "description": "Réserves de fer pour l''altitude"}]'::jsonb
),

(
  'Spitzberg — Soleil de Minuit Arctique',
  'Traversée à ski de randonnée dans l''Arctique norvégien. Nuits blanches, fjords gelés, ours polaires.',
  'Spitzberg (Svalbard) à 78°N. Traversée de 10 jours en ski de randonnée pulka dans des conditions subpolaires. Températures entre -15°C et -30°C. ATLAS évalue votre résilience au froid via votre HRV et prépare vos systèmes thermorégulateurs.',
  'Svalbard',
  'Norvège',
  'polar',
  '2027-02-20',
  '2027-03-02',
  10,
  10,
  8,
  320000,
  65,
  45.0,
  'upcoming',
  8,
  '[{"biomarker": "TSH", "min_value": 0.5, "description": "Fonction thyroïdienne pour thermorégulation"}, {"biomarker": "Vitamine D", "min_value": 40, "description": "Essentielle en milieu polaire"}]'::jsonb
),

(
  'Marathon des Sables — Sahara',
  '250 km en autosuffisance alimentaire à travers le désert marocain. La course à pied la plus dure du monde.',
  '6 étapes, 250 km, 40°C. Le Marathon des Sables est considéré comme la course pédestre la plus difficile au monde. ATLAS construit votre préparation sur 16 semaines : acclimatation thermique, nutrition désertique, gestion hydrique et profil biométrique.',
  'Désert du Sahara',
  'Maroc',
  'desert',
  '2026-04-12',
  '2026-04-22',
  11,
  12,
  3,
  280000,
  70,
  40.0,
  'open',
  16,
  '[{"biomarker": "Sodium", "min_value": 136, "description": "Équilibre électrolytique critique"}, {"biomarker": "Créatinine", "max_value": 110, "description": "Fonction rénale sous stress hydrique"}]'::jsonb
),

(
  'Traversée Atlantique à la Voile',
  'Rallye transatlantique de Las Palmas à Sainte-Lucie. 2 800 milles nautiques, 18 à 22 jours en mer.',
  'La Route du Rhum des particuliers. Une traversée de l''Atlantique de Las Palmas (Canaries) à Sainte-Lucie (Antilles). Gestion du sommeil fractionné (watch system), nutrition en mer, isolement psychologique. ATLAS prépare votre résilience mentale et physique.',
  'Las Palmas → Sainte-Lucie',
  'Atlantique',
  'sea',
  '2026-11-22',
  '2026-12-14',
  22,
  6,
  4,
  380000,
  60,
  38.0,
  'upcoming',
  10,
  '[{"biomarker": "Cortisol", "max_value": 25, "description": "Gestion du stress en isolement"}, {"biomarker": "Magnésium", "min_value": 0.75, "description": "Récupération et qualité du sommeil fractionné"}]'::jsonb
);
