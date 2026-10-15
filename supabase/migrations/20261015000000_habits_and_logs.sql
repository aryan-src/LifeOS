-- ====================================================================
-- Life Operating System (LifeOS) — Habits & Daily Logs Migration
-- Target: PostgreSQL 15+ (Supabase)
-- ====================================================================

-- 1. Create public.habits Table
create table if not exists public.habits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(title) > 0),
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create public.habit_logs Table
-- Note: 'date' is stored strictly as a PostgreSQL date (YYYY-MM-DD)
-- to prevent UTC timezone drift across client/server boundaries.
create table if not exists public.habit_logs (
    id uuid primary key default gen_random_uuid(),
    habit_id uuid not null references public.habits(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    date date not null,
    is_completed boolean not null default false,
    created_at timestamptz not null default now(),
    unique (habit_id, date)
);

-- 3. High-Velocity Indexes
create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habits_created_at on public.habits(created_at);
create index if not exists idx_habit_logs_habit_id on public.habit_logs(habit_id);
create index if not exists idx_habit_logs_date on public.habit_logs(date);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);
create index if not exists idx_habit_logs_completed on public.habit_logs(is_completed);

-- 4. Enable Row-Level Security (RLS)
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- 5. RLS Policies for public.habits
create policy "Users can view own habits"
    on public.habits for select
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

create policy "Users can insert own habits"
    on public.habits for insert
    with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

create policy "Users can update own habits"
    on public.habits for update
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

create policy "Users can delete own habits"
    on public.habits for delete
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- 6. RLS Policies for public.habit_logs
create policy "Users can view own habit logs"
    on public.habit_logs for select
    using (
        (user_id is not null and (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')))
        or exists (
            select 1 from public.habits h
            where h.id = habit_logs.habit_id
            and (h.user_id = auth.uid() or (auth.uid() is null and h.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'))
        )
    );

create policy "Users can insert own habit logs"
    on public.habit_logs for insert
    with check (
        (user_id is not null and (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')))
        or exists (
            select 1 from public.habits h
            where h.id = habit_logs.habit_id
            and (h.user_id = auth.uid() or (auth.uid() is null and h.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'))
        )
    );

create policy "Users can update own habit logs"
    on public.habit_logs for update
    using (
        (user_id is not null and (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')))
        or exists (
            select 1 from public.habits h
            where h.id = habit_logs.habit_id
            and (h.user_id = auth.uid() or (auth.uid() is null and h.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'))
        )
    );

create policy "Users can delete own habit logs"
    on public.habit_logs for delete
    using (
        (user_id is not null and (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')))
        or exists (
            select 1 from public.habits h
            where h.id = habit_logs.habit_id
            and (h.user_id = auth.uid() or (auth.uid() is null and h.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'))
        )
    );

-- 7. Updated_at Trigger for public.habits
drop trigger if exists tr_habits_updated on public.habits;
create trigger tr_habits_updated
    before update on public.habits
    for each row execute function public.handle_updated_at();
