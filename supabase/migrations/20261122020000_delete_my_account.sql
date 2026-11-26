-- ====================================================================
-- LifeOS Migration: Self-Service Account Deletion (delete_my_account)
-- Target: PostgreSQL 15+ (Supabase)
-- IMPORTANT: This migration is UNAPPLIED. It must NOT be applied until
-- the live database table list is confirmed to match the 12 public tables
-- deleted below.
-- ====================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_uid uuid;
begin
    current_uid := auth.uid();

    if current_uid is null then
        raise exception 'Not authenticated';
    end if;

    -- Explicit deletes in reverse dependency order to ensure clean cascading
    delete from public.habit_logs where user_id = current_uid;
    delete from public.habits where user_id = current_uid;
    delete from public.focus_sessions where user_id = current_uid;
    delete from public.daily_check_ins where user_id = current_uid;
    delete from public.streak_freeze_logs where user_id = current_uid;
    delete from public.transactions where user_id = current_uid;
    delete from public.categories where user_id = current_uid;
    delete from public.notes where user_id = current_uid;
    delete from public.assignments where user_id = current_uid;
    delete from public.tasks where user_id = current_uid;
    delete from public.projects where user_id = current_uid;
    delete from public.profiles where id = current_uid;

    -- Delete user record from auth schema
    delete from auth.users where id = current_uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
