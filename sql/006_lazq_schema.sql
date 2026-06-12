-- Safe migration: add new columns to matches, create market_options, add lock_time to markets

-- matches new columns
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

-- Unique index on external provider + id
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_ext_provider_id
  ON public.matches(external_provider, external_id)
  WHERE external_provider IS NOT NULL AND external_id IS NOT NULL;

-- markets: add lock_time
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS lock_time timestamptz;

-- market_options table
CREATE TABLE IF NOT EXISTS public.market_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  option_key text NOT NULL,
  option_name text NOT NULL,
  multiplier numeric(8,2) NOT NULL DEFAULT 1.80,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(market_id, option_key)
);

CREATE INDEX IF NOT EXISTS idx_market_options_market ON public.market_options(market_id);