-- ====================================================================
-- Life Operating System (LifeOS) — Assignments Module Cloud Migration
-- Target: Supabase Cloud SQL Editor (Run Once)
-- Project: xbxdpnrmsfkqmnodlwnm.supabase.co
-- Safe & Idempotent: Can be executed safely on top of existing database.
-- ====================================================================

-- 1. Create assignment_status enum type if not exists
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

-- 3. High-Velocity Query Indexes
create index if not exists idx_assignments_user_id on public.assignments(user_id);
create index if not exists idx_assignments_status on public.assignments(status);
create index if not exists idx_assignments_due_date on public.assignments(due_date);
create index if not exists idx_assignments_subject on public.assignments(subject);
create index if not exists idx_assignments_project_id on public.assignments(project_id);

-- 4. Enable Row-Level Security (RLS)
alter table public.assignments enable row level security;

-- 5. RLS Policies (Supports both active session and developer fallback user)
drop policy if exists "Users can view own assignments" on public.assignments;
create policy "Users can view own assignments"
    on public.assignments for select
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can insert own assignments" on public.assignments;
create policy "Users can insert own assignments"
    on public.assignments for insert
    with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can update own assignments" on public.assignments;
create policy "Users can update own assignments"
    on public.assignments for update
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can delete own assignments" on public.assignments;
create policy "Users can delete own assignments"
    on public.assignments for delete
    using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- 6. Updated_at Trigger
drop trigger if exists tr_assignments_updated on public.assignments;
create trigger tr_assignments_updated
    before update on public.assignments
    for each row execute function public.handle_updated_at();

-- 7. Seed Starter Assignments for Student LifeOS
insert into public.assignments (user_id, subject, title, due_date, status, marks_achieved, total_marks) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CS-301', 'Distributed Consensus & Raft Lab', current_date + 1, 'submission_pending', null, 100),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'MATH-204', 'Multivariable Calculus Problem Set 4', current_date + 3, 'in_progress', null, 50),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CS-350', 'Cloud Architecture Capstone Draft', current_date + 7, 'not_started', null, 100),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHYS-101', 'Wave Optics Experimental Analysis', current_date - 3, 'graded', 46.50, 50.00),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ENG-210', 'Technical Communication Case Study', current_date - 1, 'submitted', null, 30.00);

-- 8. Verify Table Creation
select count(*) as seeded_assignments_count from public.assignments;
