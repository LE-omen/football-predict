-- 003_policies.sql
-- Row Level Security and policies (optional if you call Supabase from server only).
-- For this app, API routes use service role/admin client for full access.
-- Below is a lightweight pattern if you ever call Supabase client-side.

alter table public.users enable row level security;
alter table public.invite_codes enable row level security;
alter table public.matches enable row level security;
alter table public.markets enable row level security;
alter table public.predictions enable row level security;
alter table public.relief_logs enable row level security;
alter table public.point_transactions enable row level security;

-- Public read for matches/markets
create policy "matches_read_public" on public.matches
for select using (true);

create policy "markets_read_public" on public.markets
for select using (true);

-- Users can read their own profile
create policy "users_self_read" on public.users
for select using (
  auth.uid() = id
);

-- Predictions: owner can read own predictions
create policy "predictions_owner_read" on public.predictions
for select using (
  auth.uid() = user_id
);

-- Point transactions: owner can read own
create policy "point_tx_owner_read" on public.point_transactions
for select using (
  auth.uid() = user_id
);

-- Relief logs: owner can read own
create policy "relief_owner_read" on public.relief_logs
for select using (
  auth.uid() = user_id
);

-- Admin bypass example (use with custom JWT claim when needed)
-- create policy "admin_all_users" on public.users
-- for all using (auth.jwt()->>'role' = 'admin');
