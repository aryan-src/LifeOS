-- ====================================================================
-- LifeOS Migration: Student Personalization & Automated Onboarding
-- Target: PostgreSQL 15+ (Supabase)
-- ====================================================================

-- 1. Create public.profiles Table
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    theme_preference text not null default 'stone' check (theme_preference in ('stone', 'light', 'dark')),
    currency_symbol text not null default '₹',
    monthly_allowance_target numeric(12, 2) not null default 15000.00 check (monthly_allowance_target >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Automatically update updated_at timestamp on profile change
drop trigger if exists tr_profiles_updated on public.profiles;
create trigger tr_profiles_updated
    before update on public.profiles
    for each row execute function public.handle_updated_at();

-- ====================================================================
-- 2. Automated Provisioning & Seeding Trigger (handle_new_user)
-- Triggers whenever a student signs up via Google OAuth or Magic Link
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
    -- Extract clean display name from OAuth metadata or email handle
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

-- Attach trigger to auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ====================================================================
-- 3. Strict Row-Level Security (RLS) Enforcement
-- ====================================================================

-- Profiles RLS
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
    for select using (auth.uid() = id or (auth.uid() is null and id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id or (auth.uid() is null and id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
    for insert with check (auth.uid() = id or (auth.uid() is null and id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Update Projects RLS to enforce strict user ownership
drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects" on public.projects
    for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects" on public.projects
    for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects" on public.projects
    for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects" on public.projects
    for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Update Tasks RLS
drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks" on public.tasks
    for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks" on public.tasks
    for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks" on public.tasks
    for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks" on public.tasks
    for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Update Categories RLS
drop policy if exists "Users can view own categories" on public.categories;
create policy "Users can view own categories" on public.categories
    for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can insert own categories" on public.categories;
create policy "Users can insert own categories" on public.categories
    for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can update own categories" on public.categories;
create policy "Users can update own categories" on public.categories
    for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can delete own categories" on public.categories;
create policy "Users can delete own categories" on public.categories
    for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Update Transactions RLS
drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions" on public.transactions
    for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions" on public.transactions
    for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions" on public.transactions
    for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions" on public.transactions
    for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

-- Update Notes RLS
drop policy if exists "Users can view own notes" on public.notes;
create policy "Users can view own notes" on public.notes
    for select using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes" on public.notes
    for insert with check (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes" on public.notes
    for update using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));

drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes" on public.notes
    for delete using (auth.uid() = user_id or (auth.uid() is null and user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
