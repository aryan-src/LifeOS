-- ====================================================================
-- Life Operating System (LifeOS) — Strict Multi-Tenant Isolation & RLS
-- Target: Supabase (PostgreSQL 15+)
-- Enforces auth.uid() = user_id across SELECT, INSERT, UPDATE, DELETE
-- and provisions new Google OAuth / email users cleanly via handle_new_user()
-- ====================================================================

-- 1. Drop all legacy / fallback policies across public schema
do $$
declare
    r record;
begin
    for r in (select schemaname, tablename, policyname from pg_policies where schemaname = 'public') loop
        execute format('drop policy if exists %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
    end loop;
end $$;

-- 2. Explicitly re-enable Row Level Security across all tables
alter table if exists public.profiles enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.transactions enable row level security;
alter table if exists public.notes enable row level security;
alter table if exists public.assignments enable row level security;
alter table if exists public.habits enable row level security;
alter table if exists public.habit_logs enable row level security;

-- 3. Enforce strict SELECT, INSERT, UPDATE, DELETE policies on public.profiles (PK is id)
create policy "profiles_select_own"
    on public.profiles for select
    to authenticated
    using (auth.uid() = id);

create policy "profiles_insert_own"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

create policy "profiles_update_own"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "profiles_delete_own"
    on public.profiles for delete
    to authenticated
    using (auth.uid() = id);

-- 4. Enforce strict SELECT, INSERT, UPDATE, DELETE policies on all user_id tables
do $$
declare
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
    foreach tbl in array user_id_tables loop
        if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
            -- SELECT policy
            execute format(
                'create policy "%s_select_own" on public.%I for select to authenticated using (auth.uid() = user_id);',
                tbl, tbl
            );
            -- INSERT policy
            execute format(
                'create policy "%s_insert_own" on public.%I for insert to authenticated with check (auth.uid() = user_id);',
                tbl, tbl
            );
            -- UPDATE policy
            execute format(
                'create policy "%s_update_own" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);',
                tbl, tbl
            );
            -- DELETE policy
            execute format(
                'create policy "%s_delete_own" on public.%I for delete to authenticated using (auth.uid() = user_id);',
                tbl, tbl
            );
        end if;
    end loop;
end $$;

-- 5. Revoke all privileges from anon role and grant to authenticated
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all routines in schema public from anon;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant all on all routines in schema public to authenticated;

-- 6. Automated Multi-Tenant Provisioning Trigger for New Accounts (Google OAuth & Email)
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

    -- 1. Provision user profile
    insert into public.profiles (
        id,
        display_name,
        theme_preference,
        currency_symbol,
        monthly_allowance_target
    ) values (
        new.id,
        default_name,
        'stone',
        '₹',
        15000.00
    )
    on conflict (id) do update set
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

    -- 2. Provision isolated student categories for the new user
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

    -- 3. Provision starter project: "Semester Academics"
    insert into public.projects (user_id, title, slug, description, status, priority)
    values (
        new.id,
        'Semester Academics',
        'semester-academics',
        'Coursework, syllabus tracking, and study goals.',
        'active',
        3
    )
    on conflict (user_id, slug) do nothing
    returning id into starter_project_id;

    -- 4. Provision starter tasks under the user's starter project
    if starter_project_id is not null then
        insert into public.tasks (user_id, project_id, title, priority, due_date) values
            (new.id, starter_project_id, 'Review course syllabus and exam schedule', 3, current_date + interval '3 days'),
            (new.id, starter_project_id, 'Set up monthly allowance and budget targets', 2, current_date + interval '1 day'),
            (new.id, null, 'Try quick capture with ⌘K', 1, current_date);
    end if;

    return new;
end;
$$;

-- Ensure trigger is active on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
