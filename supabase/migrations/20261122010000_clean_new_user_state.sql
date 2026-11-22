-- ====================================================================
-- LifeOS Migration: Clean New User Slate & Zero-State Provisioning
-- Target: PostgreSQL 15+ (Supabase)
-- Description:
-- 1. Updates public.profiles column defaults:
--    - theme_preference default to 'monsoon-garden'
--    - monthly_allowance_target default to 0.00
--    - monthly_allowance_goal default to 0.00
-- 2. Updates handle_new_user() trigger function:
--    - Provisions fresh user profiles with 'monsoon-garden' theme and 0.00 allowance target
--    - Eliminates pre-set starter tasks, starter projects, and starter categories
--    - Preserves user profile creation, Google OAuth name/avatar resolution, and RLS integrity
-- ====================================================================

-- 1. Schema Column Defaults
alter table if exists public.profiles
    alter column theme_preference set default 'monsoon-garden';

alter table if exists public.profiles
    alter column monthly_allowance_target set default 0.00;

alter table if exists public.profiles
    alter column monthly_allowance_goal set default 0.00;

-- 2. Update handle_new_user Trigger Function
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
    default_name text;
    user_avatar text;
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

    -- Provision clean user profile without pre-set tasks, projects, or categories
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
        'monsoon-garden',
        '₹',
        0.00
    )
    on conflict (id) do update set
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
