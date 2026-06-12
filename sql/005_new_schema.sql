-- 005_new_schema.sql
-- Migration: add external-provider columns, market_options, and lock/settle timestamps.

-- New columns on matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS external_provider text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_score integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_score integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS half_home_score integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS half_away_score integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS result_winner text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS result_total_goals integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS result_both_score boolean;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS result_half_winner text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS settled_at timestamptz;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS raw_json jsonb;

-- Index for dedup / lookup by provider+id
CREATE INDEX IF NOT EXISTS idx_matches_provider_extid
  ON public.matches (external_provider, external_id);

-- market_options table
CREATE TABLE IF NOT EXISTS public.market_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  option_key text NOT NULL,
  label text NOT NULL,
  multiplier numeric(6,2) NOT NULL DEFAULT 1.50,
  result public.market_result_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(market_id, option_key)
);

CREATE TRIGGER market_options_set_updated_at
  BEFORE UPDATE ON public.market_options
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- lock_time on markets
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS lock_time timestamptz;