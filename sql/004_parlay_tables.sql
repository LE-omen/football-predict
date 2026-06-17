-- 004_parlay_tables.sql
-- 新增串关/过关下注系统

-- 1. 投注单主表
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('single', 'parlay')),
  pass_type TEXT,           -- '1x1' (单关), '2x1', '3x1', '4x1' ...
  legs_count INTEGER NOT NULL DEFAULT 1,
  stake_per_line INTEGER NOT NULL,
  multiple INTEGER NOT NULL DEFAULT 1,
  total_stake INTEGER NOT NULL,
  max_potential_return NUMERIC(12,2) NOT NULL DEFAULT 0,
  settled_return INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void', 'settled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bets_user_id ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets(status);

CREATE TRIGGER bets_set_updated_at
BEFORE UPDATE ON public.bets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. 投注腿（每一场的选择）
CREATE TABLE IF NOT EXISTS public.bet_legs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  market_type TEXT NOT NULL,
  selection TEXT NOT NULL,
  odds_snapshot NUMERIC(8,2) NOT NULL,
  result_status TEXT NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'won', 'lost', 'void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bet_legs_bet_id ON public.bet_legs(bet_id);
CREATE INDEX IF NOT EXISTS idx_bet_legs_match_id ON public.bet_legs(match_id);

-- 3. 投注线（串关的每一注组合）
CREATE TABLE IF NOT EXISTS public.bet_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL,
  leg_ids UUID[] NOT NULL,          -- 组成该注的 leg id 数组
  leg_match_ids UUID[] NOT NULL,    -- 对应的 match id 数组
  line_odds NUMERIC(12,4) NOT NULL,
  line_return NUMERIC(12,2) NOT NULL,
  settled_return INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bet_lines_bet_id ON public.bet_lines(bet_id);

-- 4. 修改 predictions 表增加 bet_id 关联（可选，方便追踪）
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS bet_id UUID REFERENCES public.bets(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_bet_id ON public.predictions(bet_id);
