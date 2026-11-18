-- ====================================================================
-- LifeOS Migration: Restore Google OAuth avatar_url in handle_new_user
-- Target: PostgreSQL 15+ (Supabase)
-- Description: Additive migration ensuring public.profiles.avatar_url
-- exists and updating handle_new_user() to populate both display_name
-- (full_name / name) and avatar_url (avatar_url / picture) alongside
-- default categories on first Google OAuth signup.
-- ====================================================================

alter table if exists public.profiles
    add column if not exists avatar_url text;

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
    default_name := coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1),
        'Student'
    );

    user_avatar := coalesce(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture',
        null
    );

    -- 1. Provision user profile with Google OAuth display_name + avatar_url
    insert into public.profiles (
        id,
        display_name,
        avatar_url,
        theme_preference,
        currency_symbol,
        monthly_allowance_target
    ) values (
        new.id,
        default_name,
        user_avatar,
        'stone',
        '₹',
        15000.00
    )
    on conflict (id) do update set
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
