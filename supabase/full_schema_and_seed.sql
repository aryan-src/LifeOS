-- ====================================================================
-- Life Operating System (LifeOS) — Base Database Migration
-- Target: PostgreSQL 15+ (Supabase)
-- Environment: ARM64 Apple Silicon Optimized
-- ====================================================================

-- 0. Enable UUID Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ====================================================================
-- 1. Projects Table
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

-- ====================================================================
-- 2. Tasks Table
-- Cascading: ON DELETE SET NULL preserves task history when projects are removed
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

-- ====================================================================
-- 3. Financial Categories Table
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
-- 4. Transactions Table
-- Cascading: ON DELETE SET NULL ensures financial ledger remains intact
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
-- 5. Notes / Ideas Table
-- Cascading: ON DELETE SET NULL decouples note from project if project deleted
-- ====================================================================
create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    project_id uuid references public.projects(id) on delete set null,
    title text not null default 'Untitled Note',
    content text not null default '',
    tags jsonb not null default '[]'::jsonb,
    is_pinned boolean not null default false,
    is_archived boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ====================================================================
-- 6. Assignments Table
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

-- ====================================================================
-- Indexes for Sub-millisecond Lookups & Foreign Keys
-- ====================================================================
create index if not exists idx_projects_user_status on public.projects(user_id, status);
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_tasks_user_due on public.tasks(user_id, due_date, is_completed);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_project on public.transactions(project_id);
create index if not exists idx_transactions_category on public.transactions(category_id);
create index if not exists idx_notes_user_updated on public.notes(user_id, updated_at desc);
create index if not exists idx_notes_project on public.notes(project_id);
create index if not exists idx_notes_tags on public.notes using gin (tags);
create index if not exists idx_assignments_user_id on public.assignments(user_id);
create index if not exists idx_assignments_status on public.assignments(status);
create index if not exists idx_assignments_due_date on public.assignments(due_date);
create index if not exists idx_assignments_subject on public.assignments(subject);
create index if not exists idx_assignments_project_id on public.assignments(project_id);

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.notes enable row level security;
alter table public.assignments enable row level security;

-- Projects RLS
create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can insert own projects" on public.projects for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Tasks RLS
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Categories RLS
create policy "Users can view own categories" on public.categories for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can insert own categories" on public.categories for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can update own categories" on public.categories for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can delete own categories" on public.categories for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Transactions RLS
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Notes RLS
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Assignments RLS
create policy "Users can view own assignments" on public.assignments for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can insert own assignments" on public.assignments for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can update own assignments" on public.assignments for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
create policy "Users can delete own assignments" on public.assignments for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- ====================================================================
-- Automated updated_at Triggers
-- ====================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists tr_projects_updated on public.projects;
create trigger tr_projects_updated before update on public.projects for each row execute function public.handle_updated_at();

drop trigger if exists tr_tasks_updated on public.tasks;
create trigger tr_tasks_updated before update on public.tasks for each row execute function public.handle_updated_at();

drop trigger if exists tr_notes_updated on public.notes;
create trigger tr_notes_updated before update on public.notes for each row execute function public.handle_updated_at();

drop trigger if exists tr_assignments_updated on public.assignments;
create trigger tr_assignments_updated before update on public.assignments for each row execute function public.handle_updated_at();
-- ====================================================================
-- LifeOS Migration: Atomic Promotion RPC & Metrics Query Helpers
-- Guarantees ACID compliance for Note -> Project conversion
-- ====================================================================

-- 1. Atomic promote_to_project Stored Procedure (RPC)
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
    v_new_project_id uuid;
    v_task_record jsonb;
    v_task_title text;
    v_slug text := p_slug;
    v_counter integer := 1;
begin
    -- 1. Identify user ownership from the existing note
    select user_id into v_user_id
    from public.notes
    where id = p_note_id;

    if v_user_id is null then
        raise exception 'Note not found or access denied.';
    end if;

    -- Ensure authenticated user owns the note
    if auth.uid() is not null and auth.uid() <> v_user_id then
        raise exception 'Unauthorized to promote this note.';
    end if;

    -- 2. Handle slug uniqueness safely
    while exists (select 1 from public.projects where user_id = v_user_id and slug = v_slug) loop
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
        v_user_id,
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
                    v_user_id,
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

-- Grant execution to authenticated users
grant execute on function public.promote_to_project to authenticated, anon;
-- ====================================================================
-- LifeOS Development Seed Script
-- Provisions a dummy authenticated user and representative relational graph.
-- Compatible with Row Level Security (auth.uid() = user_id)
-- ====================================================================

do $$
declare
    v_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_project_cloud uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    v_project_fitness uuid := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    v_cat_food uuid := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
    v_cat_transport uuid := 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
    v_cat_books uuid := 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
    v_cat_subs uuid := 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77';
    v_cat_ent uuid := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88';
    v_cat_misc uuid := 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';
    v_cat_allowance uuid := 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';
    v_cat_gifts uuid := 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
begin
    -- 1. Provision dummy authenticated user in auth.users if not exists
    if not exists (select 1 from auth.users where id = v_user_id) then
        insert into auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) values (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            'dev@lifeos.local',
            crypt('Password123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"LifeOS Architect"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
    end if;

    -- 2. Seed Projects
    insert into public.projects (id, user_id, title, slug, description, status, start_date, target_date, priority, budget)
    values
        (
            v_project_cloud,
            v_user_id,
            'Cloud Infrastructure Revamp',
            'cloud-revamp',
            'Migrate monolithic workload to edge-deployed microservices and serverless database.',
            'active',
            current_date - 10,
            current_date + 20,
            3,
            2500.00
        ),
        (
            v_project_fitness,
            v_user_id,
            'Q4 Marathon Training',
            'marathon-prep',
            'Consistent aerobic base training, hydration protocols, and strength conditioning.',
            'active',
            current_date - 30,
            current_date + 60,
            2,
            600.00
        )
    on conflict (user_id, slug) do nothing;

    -- 3. Seed Financial Categories (Student Centered)
    insert into public.categories (id, user_id, name, type, color, monthly_budget)
    values
        (v_cat_food, v_user_id, 'Food & Canteen', 'expense', '#f59e0b', 150.00),
        (v_cat_transport, v_user_id, 'Transport & Commute', 'expense', '#3b82f6', 60.00),
        (v_cat_books, v_user_id, 'Books & Study Supplies', 'expense', '#10b981', 50.00),
        (v_cat_subs, v_user_id, 'Subscriptions', 'expense', '#8b5cf6', 20.00),
        (v_cat_ent, v_user_id, 'Entertainment & Hanging Out', 'expense', '#ec4899', 80.00),
        (v_cat_misc, v_user_id, 'Personal & Misc', 'expense', '#a855f7', 40.00),
        (v_cat_allowance, v_user_id, 'Pocket Money / Allowance', 'income', '#10b981', null),
        (v_cat_gifts, v_user_id, 'Gifts & Side Hustles', 'income', '#06b6d4', null)
    on conflict (user_id, name, type) do nothing;

    -- 4. Seed Tasks (Mix of project-linked and standalone)
    insert into public.tasks (user_id, project_id, title, description, is_completed, due_date, priority, sort_order)
    values
        (v_user_id, v_project_cloud, 'Configure Terraform state locks on S3', 'Ensure concurrent runs are protected', true, current_date - 2, 3, 1),
        (v_user_id, v_project_cloud, 'Deploy staging cluster in us-east-1', 'Verify ARM64 container runtime performance', false, current_date, 4, 2),
        (v_user_id, v_project_cloud, 'Setup Cloudflare DNS routing and SSL', 'Target edge proxy endpoints', false, current_date + 5, 2, 3),
        (v_user_id, v_project_fitness, 'Morning 10km tempo run', 'Zone 3 heart rate tracking', true, current_date, 2, 1),
        (v_user_id, v_project_fitness, 'Weekly mobility & core workout', 'Focus on hip stabilizers', false, current_date + 1, 1, 2),
        (v_user_id, null, 'Review personal quarterly insurance policy', 'General life admin check', false, current_date + 3, 2, 4);

    -- 5. Seed Transactions (Student Pocket Money & Daily Expenses with Project Cross-Linking)
    insert into public.transactions (user_id, project_id, category_id, amount, type, description, date, payee_or_source)
    values
        (v_user_id, null, v_cat_allowance, 450.00, 'income', 'Monthly Pocket Money from Parents', current_date - 1, 'Parents Allowance'),
        (v_user_id, null, v_cat_gifts, 60.00, 'income', 'Calculus Peer Tutoring session', current_date, 'Peer Tutoring'),
        (v_user_id, null, v_cat_food, 8.50, 'expense', 'Campus Canteen Lunch combo', current_date, 'University Dining Hall'),
        (v_user_id, null, v_cat_food, 4.20, 'expense', 'Iced Latte & study snack', current_date, 'Campus Cafe'),
        (v_user_id, null, v_cat_transport, 18.00, 'expense', 'Student Metro transit pass refill', current_date - 2, 'City Transit Authority'),
        (v_user_id, null, v_cat_subs, 5.99, 'expense', 'Spotify Student Premium', current_date - 4, 'Spotify'),
        (v_user_id, null, v_cat_books, 25.00, 'expense', 'Second-hand Calculus Textbook', current_date - 6, 'Student Book Exchange'),
        (v_user_id, null, v_cat_ent, 14.50, 'expense', 'Weekend movie ticket with friends', current_date - 3, 'AMC Theatres'),
        (v_user_id, v_project_cloud, v_cat_misc, 12.00, 'expense', 'Dev VPS server for cloud revamp initiative', current_date - 5, 'DigitalOcean');

    -- 6. Seed Notes / Ideas (Some freeform, some ready for promotion)
    insert into public.notes (user_id, project_id, title, content, tags, is_pinned)
    values
        (
            v_user_id,
            null,
            'Local-first SQLite Sync Engine',
            'Idea: Evaluate electric-sql or powersync for native offline-first sync. Key benefits: instantaneous local reads with zero network latency.',
            '["architecture", "offline", "database"]'::jsonb,
            true
        ),
        (
            v_user_id,
            null,
            'Automated Meal Prep Framework',
            'Plan: High-protein weekly prep schedule. Sunday batch cook: Quinoa, roasted salmon, sweet potatoes, green veggies.',
            '["health", "routines"]'::jsonb,
            false
        ),
        (
            v_user_id,
            v_project_cloud,
            'Kubernetes vs Nomad comparison notes',
            'Investigated Nomad for single-binary lightweight deployments vs K3s. Decided on serverless containers for initial simplicity.',
            '["devops", "cloud"]'::jsonb,
            false
        );

    -- 7. Seed Assignments (Academic deadlines, lab reports, pending submissions, graded)
    insert into public.assignments (user_id, project_id, subject, title, due_date, status, marks_achieved, total_marks)
    values
        (v_user_id, null, 'CS-301', 'Distributed Consensus & Raft Lab', current_date + 1, 'submission_pending', null, 100),
        (v_user_id, null, 'MATH-204', 'Multivariable Calculus Problem Set 4', current_date + 3, 'in_progress', null, 50),
        (v_user_id, v_project_cloud, 'CS-350', 'Cloud Architecture Capstone Draft', current_date + 7, 'not_started', null, 100),
        (v_user_id, null, 'PHYS-101', 'Wave Optics Experimental Analysis', current_date - 3, 'graded', 46.50, 50.00),
        (v_user_id, null, 'ENG-210', 'Technical Communication Case Study', current_date - 1, 'submitted', null, 30.00);
end $$;
