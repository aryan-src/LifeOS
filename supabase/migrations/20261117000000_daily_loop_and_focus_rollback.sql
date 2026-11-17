-- ====================================================================
-- Life Operating System (LifeOS) — Daily Loop & Focus Telemetry Rollback
-- Target: PostgreSQL 15+ (Supabase)
-- Description: Safely reverts all additive changes introduced in
-- 20261117000000_daily_loop_and_focus.sql without affecting existing data.
-- ====================================================================

-- 1. Drop New Tables (cascades policies and indexes)
drop table if exists public.streak_freeze_logs cascade;
drop table if exists public.daily_check_ins cascade;
drop table if exists public.focus_sessions cascade;

-- 2. Drop Added Profile Columns
alter table if exists public.profiles
    drop column if exists timezone,
    drop column if exists daily_focus_goal_minutes;
