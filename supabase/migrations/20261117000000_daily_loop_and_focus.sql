-- ====================================================================
-- Life Operating System (LifeOS) — Daily Loop & Focus Telemetry Migration
-- Target: PostgreSQL 15+ (Supabase)
-- Description: Additive schema migration introducing focus_sessions,
-- daily_check_ins, streak_freeze_logs, and profile timezone/goal settings.
-- ====================================================================

-- 1. Extend public.profiles with Timezone & Focus Preferences
-- Note: timezone is nullable with NO default; client initializes it from browser on first load.
alter table if exists public.profiles
    add column if not exists timezone text,
    add column if not exists daily_focus_goal_minutes integer not null default 240;

-- 2. Create public.focus_sessions Table
-- Features:
-- - client_session_id UUID NOT NULL UNIQUE to guarantee exactly-once persistence
--   across client reloads, reconnects, and multiple tabs (ON CONFLICT DO NOTHING).
create table if not exists public.focus_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    client_session_id uuid not null unique,
    task_id uuid references public.tasks(id) on delete set null,
    project_id uuid references public.projects(id) on delete set null,
    duration_seconds integer not null check (duration_seconds > 0),
    started_at timestamptz not null,
    ended_at timestamptz not null,
    mode text not null check (mode in ('pomodoro', 'short-break', 'long-break', 'stopwatch', 'deep-work')),
    created_at timestamptz not null default now()
);

-- 3. Create public.daily_check_ins Table
-- Features:
-- - One check-in per user per local calendar date (UNIQUE constraint).
-- - Stores finished task titles snapshot in JSONB for reflection history.
create table if not exists public.daily_check_ins (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    check_in_date date not null,
    mood text not null check (mood in ('great', 'good', 'neutral', 'difficult', 'tough')),
    reflection_text text,
    finished_task_titles jsonb not null default '[]'::jsonb,
    energy_rating integer check (energy_rating between 1 and 5),
    created_at timestamptz not null default now(),
    unique (user_id, check_in_date)
);

-- 4. Create public.streak_freeze_logs Table
-- Features:
-- - Immutable audit log of applied streak freezes.
-- - Freezes left is dynamically derived (earned - used) rather than a mutable counter.
-- - Unique constraint on (user_id, freeze_date) prevents duplicate freeze redemption.
create table if not exists public.streak_freeze_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    freeze_date date not null,
    used_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (user_id, freeze_date)
);

-- 5. High-Velocity Indexes
create index if not exists idx_focus_sessions_user_started on public.focus_sessions(user_id, started_at desc);
create index if not exists idx_focus_sessions_client_session_id on public.focus_sessions(client_session_id);
create index if not exists idx_focus_sessions_task_id on public.focus_sessions(task_id);
create index if not exists idx_focus_sessions_project_id on public.focus_sessions(project_id);

create index if not exists idx_daily_check_ins_user_date on public.daily_check_ins(user_id, check_in_date desc);
create index if not exists idx_streak_freeze_logs_user_date on public.streak_freeze_logs(user_id, freeze_date desc);

-- 6. Enable Row Level Security (RLS)
alter table public.focus_sessions enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.streak_freeze_logs enable row level security;

-- 7. Strict Multi-Tenant Isolation Policies (auth.uid() = user_id)
-- focus_sessions
create policy "focus_sessions_select_own"
    on public.focus_sessions for select
    to authenticated
    using (auth.uid() = user_id);

create policy "focus_sessions_insert_own"
    on public.focus_sessions for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "focus_sessions_update_own"
    on public.focus_sessions for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "focus_sessions_delete_own"
    on public.focus_sessions for delete
    to authenticated
    using (auth.uid() = user_id);

-- daily_check_ins
create policy "daily_check_ins_select_own"
    on public.daily_check_ins for select
    to authenticated
    using (auth.uid() = user_id);

create policy "daily_check_ins_insert_own"
    on public.daily_check_ins for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "daily_check_ins_update_own"
    on public.daily_check_ins for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "daily_check_ins_delete_own"
    on public.daily_check_ins for delete
    to authenticated
    using (auth.uid() = user_id);

-- streak_freeze_logs
create policy "streak_freeze_logs_select_own"
    on public.streak_freeze_logs for select
    to authenticated
    using (auth.uid() = user_id);

create policy "streak_freeze_logs_insert_own"
    on public.streak_freeze_logs for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "streak_freeze_logs_update_own"
    on public.streak_freeze_logs for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "streak_freeze_logs_delete_own"
    on public.streak_freeze_logs for delete
    to authenticated
    using (auth.uid() = user_id);

-- 8. Explicit Privileges
revoke all on public.focus_sessions from anon;
revoke all on public.daily_check_ins from anon;
revoke all on public.streak_freeze_logs from anon;

grant select, insert, update, delete on public.focus_sessions to authenticated;
grant select, insert, update, delete on public.daily_check_ins to authenticated;
grant select, insert, update, delete on public.streak_freeze_logs to authenticated;
