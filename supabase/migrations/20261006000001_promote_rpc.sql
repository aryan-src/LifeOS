-- ====================================================================
-- LifeOS Migration: Atomic Promotion RPC & Metrics Query Helpers
-- Guarantees ACID compliance for Note -> Project conversion
-- ====================================================================

-- 1. Atomic promote_to_project Stored Procedure (RPC)
create or replace function public.promote_to_project(
    p_note_id uuid,
    p_title text,
    p_slug text,
    p_description text default null,
    p_priority smallint default 2,
    p_budget numeric default 0.00,
    p_initial_tasks jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid;
    v_new_project_id uuid;
    v_task_record jsonb;
    v_task_title text;
    v_slug text := p_slug;
    v_counter integer := 1;
begin
    -- 1. Identify user ownership from the existing note
    select user_id into v_user_id
    from public.notes
    where id = p_note_id;

    if v_user_id is null then
        raise exception 'Note not found or access denied.';
    end if;

    -- Ensure authenticated user owns the note
    if auth.uid() is not null and auth.uid() <> v_user_id then
        raise exception 'Unauthorized to promote this note.';
    end if;

    -- 2. Handle slug uniqueness safely
    while exists (select 1 from public.projects where user_id = v_user_id and slug = v_slug) loop
        v_slug := p_slug || '-' || v_counter;
        v_counter := v_counter + 1;
    end loop;

    -- 3. Atomically insert the new project
    insert into public.projects (
        user_id,
        title,
        slug,
        description,
        status,
        priority,
        budget
    ) values (
        v_user_id,
        p_title,
        v_slug,
        p_description,
        'active',
        p_priority,
        coalesce(p_budget, 0.00)
    )
    returning id into v_new_project_id;

    -- 4. Atomically link note to new project
    update public.notes
    set project_id = v_new_project_id,
        updated_at = now()
    where id = p_note_id;

    -- 5. Atomically insert any parsed checklist tasks
    if jsonb_array_length(p_initial_tasks) > 0 then
        for v_task_record in select * from jsonb_array_elements(p_initial_tasks) loop
            v_task_title := v_task_record->>'title';
            if v_task_title is not null and char_length(trim(v_task_title)) > 0 then
                insert into public.tasks (
                    user_id,
                    project_id,
                    title,
                    is_completed,
                    due_date,
                    priority
                ) values (
                    v_user_id,
                    v_new_project_id,
                    trim(v_task_title),
                    false,
                    null,
                    2
                );
            end if;
        end loop;
    end if;

    return jsonb_build_object(
        'project_id', v_new_project_id,
        'slug', v_slug,
        'tasks_created', jsonb_array_length(p_initial_tasks)
    );
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.promote_to_project to authenticated, anon;
