-- ============================================
-- KPE ESPACE ÉLÈVE - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLE: profiles (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  stripe_customer_id text,
  role text default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLE: modules
-- ============================================
create table public.modules (
  id serial primary key,
  title text not null,
  slug text unique not null,
  description text,
  sort_order int not null,
  duration_hours int default 0,
  thumbnail_url text,
  created_at timestamptz default now()
);

-- ============================================
-- TABLE: lessons
-- ============================================
create table public.lessons (
  id serial primary key,
  module_id int references public.modules(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  video_url text,
  pdf_url text,
  sort_order int not null,
  duration_minutes int default 0,
  is_free_preview boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- TABLE: enrollments
-- ============================================
create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  product_type text not null check (product_type in ('online', 'presentiel', 'module_7', 'module_8')),
  stripe_payment_intent text,
  stripe_session_id text,
  status text default 'active' check (status in ('active', 'cancelled', 'refunded', 'pending')),
  amount_paid int, -- in cents
  enrolled_at timestamptz default now(),
  unique(user_id, product_type)
);

-- ============================================
-- TABLE: progress
-- ============================================
create table public.progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id int references public.lessons(id) on delete cascade,
  completed boolean default false,
  watch_time_seconds int default 0,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles: users can read their own profile, admins can read all
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Modules: everyone can read (public course catalog)
alter table public.modules enable row level security;

create policy "Anyone can view modules"
  on public.modules for select
  using (true);

-- Lessons: everyone can read (titles visible, video URLs protected in app logic)
alter table public.lessons enable row level security;

create policy "Anyone can view lessons"
  on public.lessons for select
  using (true);

-- Enrollments: users can read their own
alter table public.enrollments enable row level security;

create policy "Users can view own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

create policy "Admins can view all enrollments"
  on public.enrollments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Progress: users can read/write their own
alter table public.progress enable row level security;

create policy "Users can view own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.progress for update
  using (auth.uid() = user_id);

create policy "Admins can view all progress"
  on public.progress for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SEED: 8 modules KPE
-- ============================================
insert into public.modules (title, slug, description, sort_order, duration_hours) values
  ('Méridiens & Muscles', 'module-1', 'Les 14 méridiens de la médecine chinoise associés aux 14 muscles. Protocole de base et mise en situation avec un cas réel.', 1, 80),
  ('L''Appareil de Golgi', 'module-2', 'Test de précision avancé. Comprendre les subtilités du tonus musculaire pour des résultats d''une fiabilité remarquable.', 2, 110),
  ('Structure & Écologie', 'module-3', 'Les points neuro-lymphatiques, neuro-vasculaires et la relation structure-énergie-psyché.', 3, 70),
  ('Émotionnel & Psyché', 'module-4', 'Remonter aux chocs psycho-émotionnels conscients et inconscients. Le Baromètre du Comportement.', 4, 50),
  ('Corrections Profondes', 'module-5', 'Protocoles de sabotage, refoulement, inversion psychologique. Activer le changement sans résistance.', 5, 60),
  ('Synthèse & Pratique', 'module-6', 'Maîtrise complète des 15 portes d''entrée de la KPE. Séances intégrales supervisées.', 6, 60),
  ('Peurs, Habitudes & Croyances', 'module-7', 'Neuro-transmetteurs, drainage lymphatique, traits inadaptés de la personnalité.', 7, 70),
  ('Les 8 Phases de Test', 'module-8', 'Les 7 références génétiques, récepteurs de tête et de main, création de clientèle.', 8, 100);

-- ============================================
-- SEED: sample lessons for Module 1
-- ============================================
insert into public.lessons (module_id, title, slug, sort_order, duration_minutes, is_free_preview) values
  (1, 'Introduction', 'introduction', 1, 15, true),
  (1, 'A - Historique', 'a-historique', 2, 25, false),
  (1, 'B - Le test musculaire de précision et les pré-tests', 'b-test-musculaire', 3, 40, false),
  (1, 'C - Les Méridiens', 'c-les-meridiens', 4, 35, false),
  (1, 'D - Les 14 muscles', 'd-les-14-muscles', 5, 45, false),
  (1, 'E - Équilibration', 'e-equilibration', 6, 30, false),
  (1, 'F - Cas clinique', 'f-cas-clinique', 7, 35, false);
