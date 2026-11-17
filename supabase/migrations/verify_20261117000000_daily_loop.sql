-- ====================================================================
-- Life Operating System (LifeOS) — Daily Loop Migration Verification Script
-- Run this in Supabase SQL Editor after running 20261117000000_daily_loop_and_focus.sql
-- ====================================================================

-- 1. Check Table Existence (expected: 3 rows)
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name in ('focus_sessions', 'daily_check_ins', 'streak_freeze_logs')
order by table_name;

-- 2. Verify RLS is enabled on all 3 tables (relrowsecurity must be TRUE for all)
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('focus_sessions', 'daily_check_ins', 'streak_freeze_logs')
order by relname;

-- 3. Verify all 12 RLS Policies (4 per table: SELECT, INSERT, UPDATE, DELETE)
select tablename, policyname, cmd as action, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('focus_sessions', 'daily_check_ins', 'streak_freeze_logs')
order by tablename, cmd;

-- 4. Verify Columns in daily_check_ins (verifying no energy_rating, matching reflection_text and finished_task_titles)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'daily_check_ins'
order by ordinal_position;

-- 5. Verify Added Columns in public.profiles (timezone and daily_focus_goal_minutes)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('timezone', 'daily_focus_goal_minutes')
order by column_name;

-- 6. Verify Existing Profiles Rows are Untouched
select count(*) as total_profiles_count from public.profiles;
