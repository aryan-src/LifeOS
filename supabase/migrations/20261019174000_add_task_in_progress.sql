-- Migration: Add in_progress status column to tasks table
-- Supports interactive 'in progress' work state alongside 'is_completed'
alter table public.tasks 
add column if not exists in_progress boolean not null default false;

-- Create an index to support fast queries filtering by in_progress status
create index if not exists idx_tasks_user_in_progress 
on public.tasks(user_id, in_progress, is_completed);
