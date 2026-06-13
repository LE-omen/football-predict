-- 清理旧的重复数据和非世界杯比赛
DELETE FROM public.predictions;
DELETE FROM public.markets;
DELETE FROM public.matches;

-- 确保 markets 表有 option_odds 列
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS option_odds jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 确保 matches 表有同步相关列
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS external_provider text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS raw_status text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS lock_time timestamptz;

-- 唯一索引防重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_external ON public.matches(external_provider, external_id) WHERE external_provider IS NOT NULL;