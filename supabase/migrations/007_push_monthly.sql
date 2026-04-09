-- ── Push subscriptions ────────────────────────────────────────────────────────

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  unique(member_id, endpoint)
);

alter table push_subscriptions enable row level security;
create policy "push_member_manage" on push_subscriptions
  for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

create index idx_push_subscriptions_member on push_subscriptions(member_id);

-- ── Monthly questionnaire responses ──────────────────────────────────────────

create table if not exists monthly_responses (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  month text not null, -- YYYY-MM
  energy_level int check (energy_level between 1 and 10),
  mood_level int check (mood_level between 1 and 10),
  stress_level int check (stress_level between 1 and 10),
  sleep_satisfaction int check (sleep_satisfaction between 1 and 10),
  training_satisfaction int check (training_satisfaction between 1 and 10),
  nutrition_satisfaction int check (nutrition_satisfaction between 1 and 10),
  top_challenge text,
  top_win text,
  notes text,
  created_at timestamptz default now(),
  unique(member_id, month)
);

alter table monthly_responses enable row level security;
create policy "monthly_member_manage" on monthly_responses
  for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

create index idx_monthly_member on monthly_responses(member_id, month);
