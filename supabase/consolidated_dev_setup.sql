-- ====================================================================
-- Life Operating System (LifeOS) — Complete Dev Setup & Strict RLS
-- Target: Supabase Cloud SQL Editor (Project: eaawdzqfnwuokfjdyvpq)
-- Run this once in the Supabase SQL Editor.
-- ====================================================================

-- 0. Enable UUID Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ====================================================================
-- 1. Automated updated_at Function
-- ====================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ====================================================================
-- 2. Projects Table
-- ====================================================================
create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(title) > 0),
    slug text not null,
    description text,
    status text not null default 'active' check (status in ('backlog', 'active', 'paused', 'completed')),
    start_date date,
    target_date date,
    priority smallint not null default 2 check (priority between 1 and 4),
    budget numeric(12, 2) default 0.00,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id, slug)
);

drop trigger if exists tr_projects_updated on public.projects;
create trigger tr_projects_updated before update on public.projects for each row execute function public.handle_updated_at();

-- ====================================================================
-- 3. Tasks Table
-- ====================================================================
create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    project_id uuid references public.projects(id) on delete set null,
    title text not null check (char_length(title) > 0),
    description text,
    is_completed boolean not null default false,
    due_date date,
    priority smallint not null default 2 check (priority between 1 and 4),
    sort_order integer not null default 0,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists tr_tasks_updated on public.tasks;
create trigger tr_tasks_updated before update on public.tasks for each row execute function public.handle_updated_at();

-- ====================================================================
-- 4. Financial Categories Table
-- ====================================================================
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null check (char_length(name) > 0),
    type text not null check (type in ('income', 'expense')),
    color text default '#64748b',
    monthly_budget numeric(12, 2),
    created_at timestamptz not null default now(),
    unique(user_id, name, type)
);

-- ====================================================================
-- 5. Financial Transactions Table
-- ====================================================================
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    project_id uuid references public.projects(id) on delete set null,
    category_id uuid references public.categories(id) on delete set null,
    amount numeric(12, 2) not null,
    type text not null check (type in ('income', 'expense', 'transfer')),
    description text not null check (char_length(description) > 0),
    date date not null default current_date,
    payee_or_source text,
    created_at timestamptz not null default now()
);

-- ====================================================================
-- 6. Ideas & Notes Table
-- ====================================================================
create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    project_id uuid references public.projects(id) on delete set null,
    title text not null check (char_length(title) > 0),
    content text not null default '',
    tags jsonb default '[]'::jsonb,
    is_pinned boolean not null default false,
    is_archived boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists tr_notes_updated on public.notes;
create trigger tr_notes_updated before update on public.notes for each row execute function public.handle_updated_at();

-- ====================================================================
-- 7. Profiles Table
-- ====================================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    theme_preference text not null default 'stone' check (theme_preference in ('stone', 'light', 'dark', 'crimson-cream', 'crimson-dark', 'crimson-light', 'default')),
    currency_symbol text not null default '₹',
    monthly_allowance_target numeric(12, 2) not null default 15000.00 check (monthly_allowance_target >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists tr_profiles_updated on public.profiles;
create trigger tr_profiles_updated before update on public.profiles for each row execute function public.handle_updated_at();

-- ====================================================================
-- 8. Assignments Table
-- ====================================================================
do $$ begin
    create type public.assignment_status as enum (
        'not_started',
        'in_progress',
        'submission_pending',
        'submitted',
        'graded'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.assignments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    project_id uuid references public.projects(id) on delete set null,
    subject text not null check (char_length(subject) > 0),
    title text not null check (char_length(title) > 0),
    due_date date,
    status public.assignment_status not null default 'not_started',
    marks_achieved numeric(6, 2),
    total_marks numeric(6, 2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists tr_assignments_updated on public.assignments;
create trigger tr_assignments_updated before update on public.assignments for each row execute function public.handle_updated_at();

-- ====================================================================
-- 9. Habits & Habit Logs Tables
-- ====================================================================
create table if not exists public.habits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(title) > 0),
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists tr_habits_updated on public.habits;
create trigger tr_habits_updated before update on public.habits for each row execute function public.handle_updated_at();

create table if not exists public.habit_logs (
    id uuid primary key default gen_random_uuid(),
    habit_id uuid not null references public.habits(id) on delete cascade,
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    date date not null,
    is_completed boolean not null default false,
    created_at timestamptz not null default now(),
    unique (habit_id, date)
);

-- ====================================================================
-- 10. High-Velocity Indexes
-- ====================================================================
create index if not exists idx_projects_user_status on public.projects(user_id, status);
create index if not exists idx_tasks_user_status on public.tasks(user_id, is_completed);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_project on public.transactions(project_id);
create index if not exists idx_notes_user on public.notes(user_id);
create index if not exists idx_assignments_user_id on public.assignments(user_id);
create index if not exists idx_assignments_due_date on public.assignments(due_date);
create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habit_logs_habit_id on public.habit_logs(habit_id);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);

-- ====================================================================
-- 11. RPC: Atomic promote_to_project
-- ====================================================================
create or replace function public.promote_to_project(
    p_note_id uuid,
    p_title text,
    p_slug text,
    p_description text default null,
    p_priority smallint default 2,
    p_budget numeric default 0.00,
    p_initial_tasks jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid;
    v_caller_id uuid;
    v_new_project_id uuid;
    v_task_record jsonb;
    v_task_title text;
    v_slug text := p_slug;
    v_counter integer := 1;
begin
    v_caller_id := auth.uid();
    if v_caller_id is null then
        raise exception 'Unauthorized: Authentication required.';
    end if;

    select user_id into v_user_id from public.notes where id = p_note_id;
    if v_user_id is null then
        raise exception 'Note not found or access denied.';
    end if;

    if v_caller_id <> v_user_id then
        raise exception 'Unauthorized to promote this note.';
    end if;

    while exists (select 1 from public.projects where user_id = v_caller_id and slug = v_slug) loop
        v_slug := p_slug || '-' || v_counter;
        v_counter := v_counter + 1;
    end loop;

    insert into public.projects (
        user_id, title, slug, description, status, priority, budget
    ) values (
        v_caller_id, p_title, v_slug, p_description, 'active', p_priority, coalesce(p_budget, 0.00)
    )
    returning id into v_new_project_id;

    update public.notes
    set project_id = v_new_project_id, updated_at = now()
    where id = p_note_id;

    if jsonb_array_length(p_initial_tasks) > 0 then
        for v_task_record in select * from jsonb_array_elements(p_initial_tasks) loop
            v_task_title := v_task_record->>'title';
            if v_task_title is not null and char_length(trim(v_task_title)) > 0 then
                insert into public.tasks (
                    user_id, project_id, title, is_completed, due_date, priority
                ) values (
                    v_caller_id, v_new_project_id, trim(v_task_title), false, null, 2
                );
            end if;
        end loop;
    end if;

    return jsonb_build_object(
        'project_id', v_new_project_id,
        'slug', v_slug,
        'tasks_created', jsonb_array_length(p_initial_tasks)
    );
end;
$$;

-- ====================================================================
-- 12. Signup Automation Trigger (handle_new_user)
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
    default_name text;
    starter_project_id uuid;
begin
    default_name := coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1),
        'Student'
    );

    insert into public.profiles (
        id, display_name, theme_preference, currency_symbol, monthly_allowance_target
    ) values (
        new.id, default_name, 'stone', '₹', 15000.00
    )
    on conflict (id) do update set
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

    insert into public.categories (user_id, name, type, color) values
        (new.id, 'Allowance', 'income', '#10b981'),
        (new.id, 'Stationary', 'expense', '#8b5cf6'),
        (new.id, 'Junk Food', 'expense', '#f97316'),
        (new.id, 'Vegetable', 'expense', '#22c55e'),
        (new.id, 'Fruits', 'expense', '#ef4444'),
        (new.id, 'Juice', 'expense', '#eab308'),
        (new.id, 'Commute', 'expense', '#3b82f6'),
        (new.id, 'Subscription', 'expense', '#ec4899'),
        (new.id, 'Personal & Misc', 'expense', '#64748b')
    on conflict (user_id, name, type) do nothing;

    insert into public.projects (user_id, title, slug, description, status, priority)
    values (
        new.id, 'Semester Academics', 'semester-academics', 'Coursework, syllabus tracking, and study goals.', 'active', 3
    )
    on conflict (user_id, slug) do nothing
    returning id into starter_project_id;

    if starter_project_id is not null then
        insert into public.tasks (user_id, project_id, title, priority, due_date) values
            (new.id, starter_project_id, 'Review course syllabus and exam schedule', 3, current_date + interval '3 days'),
            (new.id, starter_project_id, 'Set up monthly allowance and budget targets', 2, current_date + interval '1 day'),
            (new.id, null, 'Try quick capture with ⌘K', 1, current_date);
    end if;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ====================================================================
-- 13. Enable Strict Row-Level Security (RLS) & Policies
-- ====================================================================
do $$
declare
    r record;
    tbl text;
    user_id_tables text[] := array[
        'projects',
        'tasks',
        'categories',
        'transactions',
        'notes',
        'assignments',
        'habits',
        'habit_logs'
    ];
begin
    -- Drop all old policies
    for r in (select schemaname, tablename, policyname from pg_policies where schemaname = 'public') loop
        execute format('drop policy if exists %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
    end loop;

    -- Enable RLS and create owner policy on the 8 user_id tables
    foreach tbl in array user_id_tables loop
        execute format('alter table public.%I enable row level security;', tbl);
        execute format(
            'create policy "owner full access" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));',
            tbl
        );
    end loop;

    -- Enable RLS and create policy on profiles
    alter table public.profiles enable row level security;
    create policy "own profile" on public.profiles
        for all to authenticated
        using (id = (select auth.uid()))
        with check (id = (select auth.uid()));
end $$;

-- ====================================================================
-- 14. Revoke anon access and grant strictly to authenticated
-- ====================================================================
revoke all on all tables in schema public from anon;
revoke all on all routines in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on function public.promote_to_project from anon;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on function public.promote_to_project to authenticated;
