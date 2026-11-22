-- Written against the live schema. Note: migrations 20261118000000_google_oauth_profile_avatar.sql
-- and 20261105000000_add_five_themes.sql were never applied to live, so they must not be applied blindly.
-- Clean new-user slate: new defaults and a trigger function without starter data.
-- Based on the live handle_new_user() (no avatar_url column exists live).

alter table public.profiles
    alter column theme_preference set default 'monsoon-garden';

alter table public.profiles
    alter column monthly_allowance_target set default 0.00;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    default_name text;
begin
    default_name := coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1),
        'Student'
    );

    insert into public.profiles (
        id, display_name, theme_preference, currency_symbol, monthly_allowance_target
    ) values (
        new.id, default_name, 'monsoon-garden', '₹', 0.00
    )
    on conflict (id) do update set
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

    return new;
end;
$$;
