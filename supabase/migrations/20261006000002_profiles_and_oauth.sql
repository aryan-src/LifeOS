-- ====================================================================
-- LifeOS Migration: Profiles Schema & Automated User Provisioning (OAuth)
-- Target: PostgreSQL 15+ (Supabase)
-- ====================================================================

-- 1. Create public.profiles Table extending auth.users(id)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    avatar_url text,
    currency_symbol text not null default '₹',
    monthly_allowance_goal numeric not null default 5000.00,
    monthly_allowance_target numeric not null default 5000.00,
    theme_preference text not null default 'system',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Ensure schema columns exist if table was previously created
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists monthly_allowance_goal numeric default 5000.00;
alter table public.profiles add column if not exists monthly_allowance_target numeric default 5000.00;
alter table public.profiles alter column theme_preference set default 'system';

-- Automatically update updated_at timestamp on profile change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists tr_profiles_updated on public.profiles;
create trigger tr_profiles_updated
    before update on public.profiles
    for each row execute function public.handle_updated_at();

-- ====================================================================
-- 2. Automated Provisioning Trigger (handle_new_user)
-- Fires automatically on AFTER INSERT ON auth.users when a user registers via Google
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
    default_name text;
    user_avatar text;
    starter_project_id uuid;
begin
    -- Extract clean display name from OAuth metadata or email handle
    default_name := coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1),
        'Student'
    );

    -- Extract avatar URL from Google OAuth metadata
    user_avatar := coalesce(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture',
        null
    );

    -- 1. Provision public.profiles row
    insert into public.profiles (
        id,
        display_name,
        avatar_url,
        currency_symbol,
        monthly_allowance_goal,
        monthly_allowance_target,
        theme_preference
    ) values (
        new.id,
        default_name,
        user_avatar,
        '₹',
        5000.00,
        5000.00,
        'system'
    )
    on conflict (id) do update set
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

    -- 2. Automatically seed default student financial categories linked to user's id
    insert into public.categories (user_id, name, type, color) values
        (new.id, 'Pocket Money', 'income', '#10b981'),
        (new.id, 'Food & Canteen', 'expense', '#f97316'),
        (new.id, 'Transport', 'expense', '#3b82f6'),
        (new.id, 'Subscriptions', 'expense', '#ec4899'),
        (new.id, 'Books & Supplies', 'expense', '#8b5cf6')
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

-- Attach trigger to auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ====================================================================
-- 3. Strict Row-Level Security (RLS) on public.profiles
-- Enforce policies ensuring auth.uid() = id for SELECT, INSERT, and UPDATE
-- ====================================================================
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
    for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);
