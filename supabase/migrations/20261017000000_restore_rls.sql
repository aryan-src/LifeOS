-- ====================================================================
-- Life Operating System (LifeOS) — Phase 1: Security & RLS Restoration
-- Target: Supabase (PostgreSQL 15+)
-- Replaces all seed-user fallbacks with strict multi-tenant Row Level Security.
-- ====================================================================

-- 1. Drop all legacy / fallback policies across public schema
do $$
declare
    r record;
begin
    for r in (select schemaname, tablename, policyname from pg_policies where schemaname = 'public') loop
        execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    end loop;
end $$;

-- 2. Harden habit_logs table:
-- Backfill any null user_id from parent habits table and set default & NOT NULL
do $$
begin
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'habit_logs') then
        -- Backfill user_id from habits if null
        update public.habit_logs hl
        set user_id = h.user_id
        from public.habits h
        where hl.habit_id = h.id and hl.user_id is null;

        -- Ensure user_id defaults to auth.uid()
        alter table public.habit_logs alter column user_id set default auth.uid();

        -- Set not null if no null rows remain
        if not exists (select 1 from public.habit_logs where user_id is null) then
            alter table public.habit_logs alter column user_id set not null;
        end if;
    end if;
end $$;

-- 3. Enable RLS and create owner policies on the 8 tables with user_id
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
            execute format('alter table public.%I enable row level security;', tbl);
            execute format(
                'create policy "owner full access" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));',
                tbl
            );
        end if;
    end loop;
end $$;

-- 4. Enable RLS and create owner policy on public.profiles (PK is id = auth.uid())
do $$
begin
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
        alter table public.profiles enable row level security;
        create policy "own profile" on public.profiles
            for all to authenticated
            using (id = (select auth.uid()))
            with check (id = (select auth.uid()));
    end if;
end $$;

-- 5. Lock down promote_to_project RPC function to strictly authenticated caller
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

    -- 1. Identify user ownership from the existing note
    select user_id into v_user_id
    from public.notes
    where id = p_note_id;

    if v_user_id is null then
        raise exception 'Note not found or access denied.';
    end if;

    -- Ensure authenticated caller owns the note
    if v_caller_id <> v_user_id then
        raise exception 'Unauthorized to promote this note.';
    end if;

    -- 2. Handle slug uniqueness safely for this user
    while exists (select 1 from public.projects where user_id = v_caller_id and slug = v_slug) loop
        v_slug := p_slug || '-' || v_counter;
        v_counter := v_counter + 1;
    end loop;

    -- 3. Atomically insert the new project
    insert into public.projects (
        user_id,
        title,
        slug,
        description,
        status,
        priority,
        budget
    ) values (
        v_caller_id,
        p_title,
        v_slug,
        p_description,
        'active',
        p_priority,
        coalesce(p_budget, 0.00)
    )
    returning id into v_new_project_id;

    -- 4. Atomically link note to new project
    update public.notes
    set project_id = v_new_project_id,
        updated_at = now()
    where id = p_note_id;

    -- 5. Atomically insert any parsed checklist tasks
    if jsonb_array_length(p_initial_tasks) > 0 then
        for v_task_record in select * from jsonb_array_elements(p_initial_tasks) loop
            v_task_title := v_task_record->>'title';
            if v_task_title is not null and char_length(trim(v_task_title)) > 0 then
                insert into public.tasks (
                    user_id,
                    project_id,
                    title,
                    is_completed,
                    due_date,
                    priority
                ) values (
                    v_caller_id,
                    v_new_project_id,
                    trim(v_task_title),
                    false,
                    null,
                    2
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

-- 6. Revoke anon access and grant permissions strictly to authenticated users
revoke all on all tables in schema public from anon;
revoke all on all routines in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on function public.promote_to_project from anon;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on function public.promote_to_project to authenticated;

-- 7. Ensure handle_new_user trigger exists on auth.users for automated profile & starter seeding
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

    -- 1. Provision profile entry
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

    -- 2. Seed student financial categories
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

    -- 3. Seed initial starter project: "Semester Academics"
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

    -- 4. Seed initial starter tasks
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
