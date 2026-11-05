-- Migration: Allow the five premium hook-driven workspace themes in profiles
-- Spatial Glassmorphism, Risograph Editorial, Nordic Ceramic & Linen, TUI / Terminal, Tactile Functionalism

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
      'default',
      'system'
    ));
