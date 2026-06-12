-- API-FOOTBALL integration: extend matches, add sync logs and odds tables

-- Extend matches table
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS api_football_fixture_id bigint UNIQUE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS api_football_league_id integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS api_football_season integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS venue text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS raw_status text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Sync logs
CREATE TABLE IF NOT EXISTS public.api_sync_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type text NOT NULL,
  status text NOT NULL,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- External odds raw data
CREATE TABLE IF NOT EXISTS public.external_odds_raw (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id bigint NOT NULL,
  bookmaker_name text,
  bet_key text NOT NULL,
  bet_label text,
  values_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fixture_id, bookmaker_name, bet_key)
);

CREATE INDEX IF NOT EXISTS idx_ext_odds_fixture ON public.external_odds_raw(fixture_id);