-- 005_remove_stake_limit.sql
-- 移除单注 5000 金币上限限制

ALTER TABLE public.predictions DROP CONSTRAINT IF EXISTS chk_stake_range;
ALTER TABLE public.predictions ADD CONSTRAINT chk_stake_range CHECK (stake_points >= 100);
