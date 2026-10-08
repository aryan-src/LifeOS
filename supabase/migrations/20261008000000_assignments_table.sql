-- ====================================================================
-- Life Operating System (LifeOS) — Assignments Module Migration
-- Target: PostgreSQL 15+ (Supabase)
-- ====================================================================

-- 1. Create assignment_status enum type
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

-- 2. Create public.assignments Table
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

-- 3. Indexes for High-Velocity Queries
create index if not exists idx_assignments_user_id on public.assignments(user_id);
create index if not exists idx_assignments_status on public.assignments(status);
create index if not exists idx_assignments_due_date on public.assignments(due_date);
create index if not exists idx_assignments_subject on public.assignments(subject);
create index if not exists idx_assignments_project_id on public.assignments(project_id);

-- 4. Enable Row-Level Security (RLS)
alter table public.assignments enable row level security;

-- 5. RLS Policies
create policy "Users can view own assignments"
    on public.assignments for select
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

create policy "Users can insert own assignments"
    on public.assignments for insert
    with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

create policy "Users can update own assignments"
    on public.assignments for update
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

create policy "Users can delete own assignments"
    on public.assignments for delete
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- 6. Updated_at Trigger
drop trigger if exists tr_assignments_updated on public.assignments;
create trigger tr_assignments_updated
    before update on public.assignments
    for each row execute function public.handle_updated_at();
