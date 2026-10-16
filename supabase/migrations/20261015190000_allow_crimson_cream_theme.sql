-- ====================================================================
-- LifeOS Migration: Add 'crimson-cream' to public.profiles check constraint
-- ====================================================================

alter table public.profiles drop constraint if exists profiles_theme_preference_check;
alter table public.profiles add constraint profiles_theme_preference_check 
    check (theme_preference in ('stone', 'light', 'dark', 'crimson-cream', 'crimson-dark', 'crimson-light', 'default'));
