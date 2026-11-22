-- Migration: Allow monsoon-garden and monsoon-night in public.profiles.theme_preference
-- Additive constraint update to support both Monsoon theme variants natively in Postgres.

alter table public.profiles drop constraint if exists profiles_theme_preference_check;
alter table public.profiles add constraint profiles_theme_preference_check 
    check (theme_preference in (
      'spatial-glass',
      'risograph',
      'nordic',
      'tui',
      'tactile',
      'stone',
      'light',
      'dark',
      'crimson-cream',
      'crimson-dark',
      'crimson-light',
      'monsoon-garden',
      'monsoon-night',
      'default',
      'system'
    ));
