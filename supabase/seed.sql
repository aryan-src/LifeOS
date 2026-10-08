-- ====================================================================
-- LifeOS Development Seed Script
-- Provisions a dummy authenticated user and representative relational graph.
-- Compatible with Row Level Security (auth.uid() = user_id)
-- ====================================================================

do $$
declare
    v_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_project_cloud uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    v_project_fitness uuid := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    v_cat_food uuid := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
    v_cat_transport uuid := 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
    v_cat_books uuid := 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
    v_cat_subs uuid := 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77';
    v_cat_ent uuid := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88';
    v_cat_misc uuid := 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';
    v_cat_allowance uuid := 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';
    v_cat_gifts uuid := 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
begin
    -- 1. Provision dummy authenticated user in auth.users if not exists
    if not exists (select 1 from auth.users where id = v_user_id) then
        insert into auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) values (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            'dev@lifeos.local',
            crypt('Password123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"LifeOS Architect"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
    end if;

    -- 2. Seed Projects
    insert into public.projects (id, user_id, title, slug, description, status, start_date, target_date, priority, budget)
    values
        (
            v_project_cloud,
            v_user_id,
            'Cloud Infrastructure Revamp',
            'cloud-revamp',
            'Migrate monolithic workload to edge-deployed microservices and serverless database.',
            'active',
            current_date - 10,
            current_date + 20,
            3,
            2500.00
        ),
        (
            v_project_fitness,
            v_user_id,
            'Q4 Marathon Training',
            'marathon-prep',
            'Consistent aerobic base training, hydration protocols, and strength conditioning.',
            'active',
            current_date - 30,
            current_date + 60,
            2,
            600.00
        )
    on conflict (user_id, slug) do nothing;

    -- 3. Seed Financial Categories (Student Centered)
    insert into public.categories (id, user_id, name, type, color, monthly_budget)
    values
        (v_cat_food, v_user_id, 'Food & Canteen', 'expense', '#f59e0b', 150.00),
        (v_cat_transport, v_user_id, 'Transport & Commute', 'expense', '#3b82f6', 60.00),
        (v_cat_books, v_user_id, 'Books & Study Supplies', 'expense', '#10b981', 50.00),
        (v_cat_subs, v_user_id, 'Subscriptions', 'expense', '#8b5cf6', 20.00),
        (v_cat_ent, v_user_id, 'Entertainment & Hanging Out', 'expense', '#ec4899', 80.00),
        (v_cat_misc, v_user_id, 'Personal & Misc', 'expense', '#a855f7', 40.00),
        (v_cat_allowance, v_user_id, 'Pocket Money / Allowance', 'income', '#10b981', null),
        (v_cat_gifts, v_user_id, 'Gifts & Side Hustles', 'income', '#06b6d4', null)
    on conflict (user_id, name, type) do nothing;

    -- 4. Seed Tasks (Mix of project-linked and standalone)
    insert into public.tasks (user_id, project_id, title, description, is_completed, due_date, priority, sort_order)
    values
        (v_user_id, v_project_cloud, 'Configure Terraform state locks on S3', 'Ensure concurrent runs are protected', true, current_date - 2, 3, 1),
        (v_user_id, v_project_cloud, 'Deploy staging cluster in us-east-1', 'Verify ARM64 container runtime performance', false, current_date, 4, 2),
        (v_user_id, v_project_cloud, 'Setup Cloudflare DNS routing and SSL', 'Target edge proxy endpoints', false, current_date + 5, 2, 3),
        (v_user_id, v_project_fitness, 'Morning 10km tempo run', 'Zone 3 heart rate tracking', true, current_date, 2, 1),
        (v_user_id, v_project_fitness, 'Weekly mobility & core workout', 'Focus on hip stabilizers', false, current_date + 1, 1, 2),
        (v_user_id, null, 'Review personal quarterly insurance policy', 'General life admin check', false, current_date + 3, 2, 4);

    -- 5. Seed Transactions (Student Pocket Money & Daily Expenses with Project Cross-Linking)
    insert into public.transactions (user_id, project_id, category_id, amount, type, description, date, payee_or_source)
    values
        (v_user_id, null, v_cat_allowance, 450.00, 'income', 'Monthly Pocket Money from Parents', current_date - 1, 'Parents Allowance'),
        (v_user_id, null, v_cat_gifts, 60.00, 'income', 'Calculus Peer Tutoring session', current_date, 'Peer Tutoring'),
        (v_user_id, null, v_cat_food, 8.50, 'expense', 'Campus Canteen Lunch combo', current_date, 'University Dining Hall'),
        (v_user_id, null, v_cat_food, 4.20, 'expense', 'Iced Latte & study snack', current_date, 'Campus Cafe'),
        (v_user_id, null, v_cat_transport, 18.00, 'expense', 'Student Metro transit pass refill', current_date - 2, 'City Transit Authority'),
        (v_user_id, null, v_cat_subs, 5.99, 'expense', 'Spotify Student Premium', current_date - 4, 'Spotify'),
        (v_user_id, null, v_cat_books, 25.00, 'expense', 'Second-hand Calculus Textbook', current_date - 6, 'Student Book Exchange'),
        (v_user_id, null, v_cat_ent, 14.50, 'expense', 'Weekend movie ticket with friends', current_date - 3, 'AMC Theatres'),
        (v_user_id, v_project_cloud, v_cat_misc, 12.00, 'expense', 'Dev VPS server for cloud revamp initiative', current_date - 5, 'DigitalOcean');

    -- 6. Seed Notes / Ideas (Some freeform, some ready for promotion)
    insert into public.notes (user_id, project_id, title, content, tags, is_pinned)
    values
        (
            v_user_id,
            null,
            'Local-first SQLite Sync Engine',
            'Idea: Evaluate electric-sql or powersync for native offline-first sync. Key benefits: instantaneous local reads with zero network latency.',
            '["architecture", "offline", "database"]'::jsonb,
            true
        ),
        (
            v_user_id,
            null,
            'Automated Meal Prep Framework',
            'Plan: High-protein weekly prep schedule. Sunday batch cook: Quinoa, roasted salmon, sweet potatoes, green veggies.',
            '["health", "routines"]'::jsonb,
            false
        ),
        (
            v_user_id,
            v_project_cloud,
            'Kubernetes vs Nomad comparison notes',
            'Investigated Nomad for single-binary lightweight deployments vs K3s. Decided on serverless containers for initial simplicity.',
            '["devops", "cloud"]'::jsonb,
            false
        );

    -- 7. Seed Assignments (Academic deadlines, lab reports, pending submissions, graded)
    insert into public.assignments (user_id, project_id, subject, title, due_date, status, marks_achieved, total_marks)
    values
        (v_user_id, null, 'CS-301', 'Distributed Consensus & Raft Lab', current_date + 1, 'submission_pending', null, 100),
        (v_user_id, null, 'MATH-204', 'Multivariable Calculus Problem Set 4', current_date + 3, 'in_progress', null, 50),
        (v_user_id, v_project_cloud, 'CS-350', 'Cloud Architecture Capstone Draft', current_date + 7, 'not_started', null, 100),
        (v_user_id, null, 'PHYS-101', 'Wave Optics Experimental Analysis', current_date - 3, 'graded', 46.50, 50.00),
        (v_user_id, null, 'ENG-210', 'Technical Communication Case Study', current_date - 1, 'submitted', null, 30.00);
end $$;
