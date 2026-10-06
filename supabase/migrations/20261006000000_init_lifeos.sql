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

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.notes enable row level security;

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
