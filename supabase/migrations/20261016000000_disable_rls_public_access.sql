-- ====================================================================
-- Life Operating System (LifeOS) — Public Mode RLS Bypass
-- Disables Row-Level Security on all application tables to allow
-- full seamless public read/write access without requiring user sessions.
-- ====================================================================

-- 1. Disable RLS across all functional modules
alter table if exists public.profiles disable row level security;
alter table if exists public.projects disable row level security;
alter table if exists public.tasks disable row level security;
alter table if exists public.categories disable row level security;
alter table if exists public.transactions disable row level security;
alter table if exists public.notes disable row level security;
alter table if exists public.assignments disable row level security;
alter table if exists public.habits disable row level security;
alter table if exists public.habit_logs disable row level security;

-- 2. Ensure anon and authenticated roles have full permissions
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
