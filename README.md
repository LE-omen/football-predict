# 足球积分预测

私密足球赛果预测积分站（仅朋友间娱乐用途）。

## 合规声明

本站为朋友间娱乐性质的足球赛果预测积分站，不提供任何充值、提现、购彩、兑奖、奖品兑换或现金结算服务。站内积分仅为虚拟娱乐积分，不具备现金价值，不可转让、交易或兑换。

## 技术栈
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL

## 启动步骤

### 1. Supabase 数据库
在 Supabase SQL Editor 中依次执行：
1. `sql/001_schema.sql`
2. `sql/002_seed.sql`
3. `sql/003_policies.sql`

### 2. 环境变量
复制 `.env.local.example` 为 `.env.local`，填入 Supabase 配置：
`ash
cp .env.local.example .env.local
`

### 3. 安装与启动
`ash
npm install
npm run dev
`

### 4. 账号说明
- 第一版登录采用昵称+密码，注册需邀请码。
- 管理员账号需手动在数据库设置 `role = 'admin'`。

## 数据源：Lazq 赛程抓取器

比赛数据通过内置的 lazq 赛程抓取脚本获取，无需第三方体育 API。

### 手动更新赛程
`ash
npx ts-node scripts/sync-lazq.ts
`

### GitHub Actions 定时更新
项目包含 GitHub Actions 工作流 (`.github/workflows/sync-matches.yml`)，可配置定时任务自动抓取最新赛程数据。默认每天运行一次。

手动触发方式：进入 GitHub 仓库 → Actions → 选择 "Sync Matches" → "Run workflow"。

## 功能概览
- 邀请码注册
- 昵称+密码登录
- 世界杯赛程列表
- 五种预测项目（胜平负、准确比分、总进球、双方是否进球、半场胜平负）
- 命中返还积分
- 好友积分榜
- 管理员后台比赛结算
- 虚拟积分系统（仅供娱乐）