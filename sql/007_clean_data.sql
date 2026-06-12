-- Clean all prediction/market/match data for a fresh start
-- Keep users, invite_codes, point_transactions (history), relief_logs

DELETE FROM predictions;
DELETE FROM markets;
DELETE FROM matches;

-- Reset sequences if needed (UUIDs don't need this)

SELECT 'Cleaned predictions, markets, matches tables' as status;