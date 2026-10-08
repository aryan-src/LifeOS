-- ====================================================================
-- Life Operating System (LifeOS) — Complete Setup Script for Cloud Supabase
-- Target: Supabase Cloud SQL Editor (Run Once)
-- ====================================================================

-- 0. Enable UUID Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. Create Default Developer User in auth.users
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
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'authenticated',
  'authenticated',
  'dev@lifeos.local',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

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
-- 5. Transactions Table
-- ====================================================================
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category_id uuid references public.categories(id) on delete set null,
    project_id uuid references public.projects(id) on delete set null,
    amount numeric(12, 2) not null,
    type text not null check (type in ('income', 'expense', 'transfer')),
    description text not null check (char_length(description) > 0),
    date date not null default current_date,
    payee_or_source text,
    created_at timestamptz not null default now()
);

-- ====================================================================
-- 6. Notes Table
-- ====================================================================
create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    project_id uuid references public.projects(id) on delete set null,
    title text not null default 'Untitled' check (char_length(title) > 0),
    content text default '',
    tags text[] not null default '{}',
    is_archived boolean not null default false,
    is_pinned boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ====================================================================
-- 6b. Assignments Table
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
-- 7. Performance Indexes
-- ====================================================================
create index if not exists idx_projects_user_status on public.projects(user_id, status);
create index if not exists idx_tasks_user_completed on public.tasks(user_id, is_completed);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_project on public.transactions(project_id);
create index if not exists idx_notes_user_archived on public.notes(user_id, is_archived);
create index if not exists idx_notes_tags on public.notes using gin (tags);
create index if not exists idx_assignments_user_id on public.assignments(user_id);
create index if not exists idx_assignments_status on public.assignments(status);
create index if not exists idx_assignments_due_date on public.assignments(due_date);
create index if not exists idx_assignments_subject on public.assignments(subject);
create index if not exists idx_assignments_project_id on public.assignments(project_id);

-- ====================================================================
-- 8. Enable Row Level Security (RLS)
-- ====================================================================
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.notes enable row level security;
alter table public.assignments enable row level security;

-- Projects Policies
drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects" on public.projects for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Tasks Policies
drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Categories Policies
drop policy if exists "Users can view own categories" on public.categories;
create policy "Users can view own categories" on public.categories for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can insert own categories" on public.categories;
create policy "Users can insert own categories" on public.categories for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can update own categories" on public.categories;
create policy "Users can update own categories" on public.categories for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can delete own categories" on public.categories;
create policy "Users can delete own categories" on public.categories for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Transactions Policies
drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Notes Policies
drop policy if exists "Users can view own notes" on public.notes;
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Assignments Policies
drop policy if exists "Users can view own assignments" on public.assignments;
create policy "Users can view own assignments" on public.assignments for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can insert own assignments" on public.assignments;
create policy "Users can insert own assignments" on public.assignments for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can update own assignments" on public.assignments;
create policy "Users can update own assignments" on public.assignments for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
drop policy if exists "Users can delete own assignments" on public.assignments;
create policy "Users can delete own assignments" on public.assignments for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- ====================================================================
-- 9. Automated updated_at Triggers
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
-- 10. RPC: Promote Note to Project Function
-- ====================================================================
create or replace function public.promote_note_to_project(
    p_note_id uuid,
    p_title text,
    p_slug text,
    p_description text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
    v_project_id uuid;
    v_note_title text;
    v_note_content text;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        v_user_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
    end if;

    select title, content into v_note_title, v_note_content
    from public.notes
    where id = p_note_id and user_id = v_user_id;

    if not found then
        raise exception 'Note not found or unauthorized' using errcode = 'P0002';
    end if;

    insert into public.projects (
        user_id,
        title,
        slug,
        description,
        status
    ) values (
        v_user_id,
        p_title,
        p_slug,
        coalesce(p_description, v_note_content),
        'active'
    ) returning id into v_project_id;

    update public.notes
    set project_id = v_project_id,
        updated_at = now()
    where id = p_note_id;

    return jsonb_build_object(
        'project_id', v_project_id,
        'slug', p_slug,
        'note_id', p_note_id
    );
end;
$$;

-- ====================================================================
-- 11. Seed Default Student Categories
-- ====================================================================
insert into public.categories (user_id, name, type, color) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Allowance', 'income', '#10b981'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stationary', 'expense', '#8b5cf6'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Junk Food', 'expense', '#f97316'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Vegetable', 'expense', '#22c55e'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fruits', 'expense', '#ef4444'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Juice', 'expense', '#eab308'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Commute', 'expense', '#3b82f6'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Subscription', 'expense', '#ec4899'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Personal & Misc', 'expense', '#64748b')
on conflict (user_id, name, type) do nothing;

-- ====================================================================
-- 12. Seed Default Assignments
-- ====================================================================
insert into public.assignments (user_id, subject, title, due_date, status, marks_achieved, total_marks) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CS-301', 'Distributed Consensus & Raft Lab', current_date + 1, 'submission_pending', null, 100),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'MATH-204', 'Multivariable Calculus Problem Set 4', current_date + 3, 'in_progress', null, 50),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CS-350', 'Cloud Architecture Capstone Draft', current_date + 7, 'not_started', null, 100),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHYS-101', 'Wave Optics Experimental Analysis', current_date - 3, 'graded', 46.50, 50.00),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ENG-210', 'Technical Communication Case Study', current_date - 1, 'submitted', null, 30.00);
