-- 005_jobs_schema.sql
-- Extend matches table for external provider sync and auto-lock

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS external_provider text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS lock_time timestamptz;

-- Unique constraint on (external_provider, external_id) when both are set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_external_key'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_external_key UNIQUE (external_provider, external_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matches_external_key ON public.matches(external_provider, external_id);
CREATE INDEX IF NOT EXISTS idx_markets_lock_time ON public.markets(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_lock_time ON public.matches(lock_time);