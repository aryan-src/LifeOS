#!/usr/bin/env node
/**
 * Data Migration & Restoration Helper
 * Restores snapshot data from backups/phase-0-snapshot/ to a specified user.
 * 
 * Usage:
 *   node scripts/restore-snapshot-to-user.mjs <target-user-uuid>
 *   # Or with email & password for authenticated RLS insert:
 *   node scripts/restore-snapshot-to-user.mjs <user-email> <user-password>
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local if not already in process.env
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL and Supabase key in environment or .env.local.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Please specify a target user UUID or email/password:');
  console.error('   node scripts/restore-snapshot-to-user.mjs <target-user-uuid>');
  console.error('   node scripts/restore-snapshot-to-user.mjs <user-email> <user-password>');
  process.exit(1);
}

const backupDir = resolve(process.cwd(), 'backups/phase-0-snapshot');
if (!existsSync(backupDir)) {
  console.error(`❌ Backup directory not found at: ${backupDir}`);
  process.exit(1);
}

function loadBackupJson(tableName) {
  const file = join(backupDir, `${tableName}.json`);
  if (!existsSync(file)) return [];
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn(`⚠️ Warning: could not parse ${file}: ${e.message}`);
    return [];
  }
}

async function run() {
  let supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  let targetUserId = null;

  // UUID regex
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args[0]);

  if (isUuid) {
    targetUserId = args[0];
    console.log(`🎯 Target user UUID provided: ${targetUserId}`);
  } else if (args[1]) {
    const email = args[0];
    const password = args[1];
    console.log(`🔐 Authenticating as ${email}...`);
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authErr || !authData?.user) {
      console.error(`❌ Failed to sign in as ${email}:`, authErr?.message);
      process.exit(1);
    }
    targetUserId = authData.user.id;
    console.log(`✅ Authenticated successfully! User ID: ${targetUserId}`);
  } else {
    console.error('❌ Invalid argument. Provide a valid UUID or email and password.');
    process.exit(1);
  }

  console.log(`\n📦 Starting snapshot restoration to user ${targetUserId}...`);

  // 1. Restore Categories
  const categories = loadBackupJson('categories');
  const categoryIdMap = new Map(); // oldId -> newId

  if (categories.length > 0) {
    console.log(`\n📂 Processing ${categories.length} categories...`);

    // Fetch existing categories for user to avoid duplication by name
    const { data: existingCats } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', targetUserId);

    const existingByName = new Map((existingCats || []).map((c) => [c.name.toLowerCase(), c.id]));

    for (const cat of categories) {
      const existingId = existingByName.get(cat.name.toLowerCase());
      if (existingId) {
        categoryIdMap.set(cat.id, existingId);
      } else {
        const { data: inserted, error } = await supabase
          .from('categories')
          .insert({
            user_id: targetUserId,
            name: cat.name,
            type: cat.type || 'expense',
            color: cat.color || '#64748b',
            monthly_budget: cat.monthly_budget || null,
          })
          .select('id')
          .single();

        if (error) {
          console.warn(`  ⚠️ Failed to insert category "${cat.name}":`, error.message);
        } else if (inserted) {
          categoryIdMap.set(cat.id, inserted.id);
          existingByName.set(cat.name.toLowerCase(), inserted.id);
        }
      }
    }
    console.log(`  ✅ Mapped ${categoryIdMap.size} categories.`);
  }

  // 2. Restore Projects
  const projects = loadBackupJson('projects');
  const projectIdMap = new Map(); // oldId -> newId

  if (projects.length > 0) {
    console.log(`\n📁 Processing ${projects.length} projects...`);
    for (const proj of projects) {
      const { data: inserted, error } = await supabase
        .from('projects')
        .insert({
          user_id: targetUserId,
          title: proj.title,
          slug: `${proj.slug || 'proj'}-${Date.now().toString().slice(-4)}`,
          description: proj.description,
          status: proj.status || 'active',
          priority: proj.priority || 2,
          budget: proj.budget || 0,
          target_date: proj.target_date,
        })
        .select('id')
        .single();

      if (error) {
        console.warn(`  ⚠️ Failed to insert project "${proj.title}":`, error.message);
      } else if (inserted) {
        projectIdMap.set(proj.id, inserted.id);
      }
    }
    console.log(`  ✅ Restored ${projectIdMap.size} projects.`);
  }

  // 3. Restore Transactions
  const transactions = loadBackupJson('transactions');
  if (transactions.length > 0) {
    console.log(`\n💳 Restoring ${transactions.length} transactions...`);
    let txSuccess = 0;
    for (const tx of transactions) {
      const newCatId = tx.category_id ? (categoryIdMap.get(tx.category_id) || null) : null;
      const newProjId = tx.project_id ? (projectIdMap.get(tx.project_id) || null) : null;

      const { error } = await supabase.from('transactions').insert({
        user_id: targetUserId,
        category_id: newCatId,
        project_id: newProjId,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        date: tx.date,
        payee_or_source: tx.payee_or_source,
      });

      if (error) {
        console.warn(`  ⚠️ Failed to insert transaction "${tx.description}":`, error.message);
      } else {
        txSuccess++;
      }
    }
    console.log(`  ✅ Restored ${txSuccess}/${transactions.length} transactions.`);
  }

  // 4. Restore Assignments
  const assignments = loadBackupJson('assignments');
  if (assignments.length > 0) {
    console.log(`\n📚 Restoring ${assignments.length} assignments...`);
    let assignSuccess = 0;
    for (const a of assignments) {
      const newProjId = a.project_id ? (projectIdMap.get(a.project_id) || null) : null;

      const { error } = await supabase.from('assignments').insert({
        user_id: targetUserId,
        project_id: newProjId,
        subject: a.subject,
        title: a.title,
        due_date: a.due_date,
        status: a.status || 'not_started',
        marks_achieved: a.marks_achieved,
        total_marks: a.total_marks,
      });

      if (error) {
        console.warn(`  ⚠️ Failed to insert assignment "${a.title}":`, error.message);
      } else {
        assignSuccess++;
      }
    }
    console.log(`  ✅ Restored ${assignSuccess}/${assignments.length} assignments.`);
  }

  // 5. Restore Notes
  const notes = loadBackupJson('notes');
  if (notes.length > 0) {
    console.log(`\n📝 Restoring ${notes.length} notes...`);
    let notesSuccess = 0;
    for (const n of notes) {
      const newProjId = n.project_id ? (projectIdMap.get(n.project_id) || null) : null;
      const { error } = await supabase.from('notes').insert({
        user_id: targetUserId,
        project_id: newProjId,
        title: n.title,
        content: n.content,
        tags: n.tags || [],
        is_pinned: n.is_pinned || false,
      });

      if (error) {
        console.warn(`  ⚠️ Failed to insert note "${n.title}":`, error.message);
      } else {
        notesSuccess++;
      }
    }
    console.log(`  ✅ Restored ${notesSuccess}/${notes.length} notes.`);
  }

  // 6. Restore Tasks
  const tasks = loadBackupJson('tasks');
  if (tasks.length > 0) {
    console.log(`\n✅ Restoring ${tasks.length} tasks...`);
    let tasksSuccess = 0;
    for (const t of tasks) {
      const newProjId = t.project_id ? (projectIdMap.get(t.project_id) || null) : null;
      const { error } = await supabase.from('tasks').insert({
        user_id: targetUserId,
        project_id: newProjId,
        title: t.title,
        description: t.description,
        is_completed: t.is_completed || false,
        due_date: t.due_date,
        priority: t.priority || 2,
      });

      if (error) {
        console.warn(`  ⚠️ Failed to insert task "${t.title}":`, error.message);
      } else {
        tasksSuccess++;
      }
    }
    console.log(`  ✅ Restored ${tasksSuccess}/${tasks.length} tasks.`);
  }

  // 7. Restore Habits
  const habits = loadBackupJson('habits');
  if (habits.length > 0) {
    console.log(`\n🔁 Restoring ${habits.length} habits...`);
    let habitsSuccess = 0;
    for (const h of habits) {
      const { error } = await supabase.from('habits').insert({
        user_id: targetUserId,
        title: h.title,
        description: h.description,
      });
      if (!error) habitsSuccess++;
    }
    console.log(`  ✅ Restored ${habitsSuccess}/${habits.length} habits.`);
  }

  console.log('\n🎉 Restoration process complete!\n');
}

run().catch((err) => {
  console.error('Fatal error during restoration:', err);
  process.exit(1);
});
