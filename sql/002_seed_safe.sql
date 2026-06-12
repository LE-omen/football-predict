-- 002_seed.sql
-- Invite codes
insert into public.invite_codes (code, is_active)
values
  ('WORLD2026', true),
  ('FRIENDS26', true),
  ('GOAL2026', true)
on conflict (code) do nothing;

-- 3 test matches (start time = 3~5 days from now)
with m1 as (
  insert into public.matches (league, stage, home_team, away_team, start_time, status)
  values ('World Cup', 'Group A', 'Brazil', 'Serbia', now() + interval '3 days', 'scheduled')
  returning id
),
m2 as (
  insert into public.matches (league, stage, home_team, away_team, start_time, status)
  values ('World Cup', 'Group B', 'Germany', 'Japan', now() + interval '4 days', 'scheduled')
  returning id
),
m3 as (
  insert into public.matches (league, stage, home_team, away_team, start_time, status)
  values ('World Cup', 'Group C', 'Argentina', 'Mexico', now() + interval '5 days', 'scheduled')
  returning id
),
all_m as (
  select id from m1 union all select id from m2 union all select id from m3
)
insert into public.markets (match_id, market_type, title, options, multiplier)
select
  m.id,
  v.market_type::public.market_type,
  v.title,
  v.options::jsonb,
  v.multiplier::numeric
from all_m m
cross join (
  values
    ('1x2', '1x2', '["home","draw","away"]'::jsonb, 1.80),
    ('exact_score', 'Exact Score', '["0-0","1-0","0-1","1-1","2-0","0-2","2-1","1-2","2-2","3-0","0-3","3-1","1-3","3-2","2-3","other"]'::jsonb, 7.00),
    ('total_goals', 'Total Goals', '["over2.5","under2.5"]'::jsonb, 1.90),
    ('btts', 'Both Teams To Score', '["yes","no"]'::jsonb, 1.85),
    ('ht_1x2', 'HT 1x2', '["home","draw","away"]'::jsonb, 2.20)
) v(title, market_type, options, multiplier);