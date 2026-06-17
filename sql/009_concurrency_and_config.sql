-- 009_concurrency_and_config.sql
-- 评审建议落地：并发控制 + 可配置项 + 清理
-- 在 Supabase SQL Editor 中执行

begin;

-- 1. 防止同一用户对同一 market+option 重复提交 pending 预测
create unique index if not exists ux_predictions_user_market_option_pending
on public.predictions(user_id, market_id, selected_option)
where status = 'pending';

-- 2. predictions 表确保用服务端时间
alter table public.predictions alter column created_at set default now();

-- 3. users 表增加昵称修改标记（每人仅一次）
alter table public.users add column if not exists nickname_changed boolean not null default false;

commit;
