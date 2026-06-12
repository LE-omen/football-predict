-- 001_schema.sql
-- Supabase PostgreSQL schema for 私密足球赛果预测积分站

-- Enable useful extensions if not already enabled
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ENUM types
create type public.user_role as enum ('user', 'admin');
create type public.match_status as enum ('scheduled', 'locked', 'settled', 'canceled');
create type public.market_type as enum (
  '1x2',
  'exact_score',
  'total_goals',
  'btts',
  'ht_1x2'
);
create type public.market_result_status as enum ('pending', 'won', 'lost', 'void');

-- Utility: auto-updated updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- USERS
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  nickname text not null unique,
  password_hash text not null,
  role public.user_role not null default 'user',
  points integer not null default 10000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- INVITE CODES
create table if not exists public.invite_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  created_by uuid references public.users(id) on delete set null,
  is_active boolean not null default true,
  used_by uuid references public.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger invite_codes_set_updated_at
before update on public.invite_codes
for each row execute function public.set_updated_at();

-- MATCHES
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  league text,
  stage text,
  home_team text not null,
  away_team text not null,
  start_time timestamptz not null,
  status public.match_status not null default 'scheduled',
  ft_home_goals integer,
  ft_away_goals integer,
  ht_home_goals integer,
  ht_away_goals integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

-- MARKETS per match
create table if not exists public.markets (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  market_type public.market_type not null,
  title text not null,
  options jsonb not null default '[]'::jsonb,
  multiplier numeric(6,2) not null default 1.50,
  is_active boolean not null default true,
  market_result public.market_result_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(match_id, market_type)
);

create trigger markets_set_updated_at
before update on public.markets
for each row execute function public.set_updated_at();

-- PREDICTIONS
create table if not exists public.predictions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  selected_option text not null,
  stake_points integer not null,
  status public.market_result_status not null default 'pending',
  payout_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_stake_range check (stake_points between 100 and 5000),
  constraint chk_stake_multiple check (mod(stake_points, 100) = 0)
);

create index if not exists idx_predictions_user_id on public.predictions(user_id);
create index if not exists idx_predictions_match_id on public.predictions(match_id);
create index if not exists idx_predictions_market_id on public.predictions(market_id);

create trigger predictions_set_updated_at
before update on public.predictions
for each row execute function public.set_updated_at();

-- DAILY RELIEF LOGS
create table if not exists public.relief_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null default 1000,
  created_at timestamptz not null default now(),
  created_date date not null default current_date
);

create index if not exists idx_relief_user_date on public.relief_logs(user_id, created_date);

-- POINT TRANSACTIONS (积分流水)
create table if not exists public.point_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_point_tx_user on public.point_transactions(user_id);
create index if not exists idx_point_tx_created on public.point_transactions(created_at);

-- Helper views/indices can be added later.
