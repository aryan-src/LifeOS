import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client for isolated E2E Test Setup and Teardown
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5OTk5OTk5OTl9.CJRf_9HBUDNd7t0ilkETbuBmLs68GZKD-LFb4krWwe0';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_TAG_PREFIX = 'e2e-test-';
const TEST_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

test.describe('LifeOS Cross-Module Relational Workflows (E2E)', () => {
  // CRITICAL CONSTRAINT (Data Teardown):
  // Clean up any test artifacts generated during test runs to prevent database pollution
  test.afterEach(async () => {
    try {
      // 1. Teardown test transactions
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', TEST_USER_ID)
        .like('description', `%${TEST_TAG_PREFIX}%`);

      // 2. Teardown test tasks
      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', TEST_USER_ID)
        .like('title', `%${TEST_TAG_PREFIX}%`);

      // 3. Teardown test notes
      await supabase
        .from('notes')
        .delete()
        .eq('user_id', TEST_USER_ID)
        .like('title', `%${TEST_TAG_PREFIX}%`);

      // 4. Teardown test projects
      await supabase
        .from('projects')
        .delete()
        .eq('user_id', TEST_USER_ID)
        .like('slug', `%${TEST_TAG_PREFIX}%`);
    } catch (e) {
      console.warn('Teardown warning:', e);
    }
  });

  test('Workflow 1: Quick Capture Omnibar to Finances with Project Tagging', async ({ page }) => {
    await page.goto('/');

    // 1. Open Quick Capture Omnibar using keyboard shortcut Cmd+K / Ctrl+K
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');
    const input = page.getByPlaceholder(/Type anything:/i);
    await expect(input).toBeVisible();

    // 2. Type an expense entry tagged to #cloud-revamp
    const uniqueTxDesc = `${TEST_TAG_PREFIX}domain purchase`;
    await input.fill(`$150 ${uniqueTxDesc} #cloud-revamp`);

    // 3. Verify real-time summary pill updates dynamically
    await expect(page.getByText(/Transaction: -\$150.00/i)).toBeVisible();
    await expect(page.getByText(/#cloud-revamp/i)).toBeVisible();

    // 4. Press Enter to submit
    await page.keyboard.press('Enter');

    // 5. Verify toast feedback
    await expect(page.getByText(/Logged -\$150.00/i)).toBeVisible();

    // 6. Navigate to Finances ledger and assert transaction appears in table
    await page.goto('/finances');
    await expect(page.getByText(uniqueTxDesc)).toBeVisible();
    await expect(page.getByText('-$150.00')).toBeVisible();
  });

  test('Workflow 2: Quick Capture Omnibar to Daily Tasks with Due Date', async ({ page }) => {
    await page.goto('/');

    // Open Quick Capture
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');
    const input = page.getByPlaceholder(/Type anything:/i);
    await expect(input).toBeVisible();

    const uniqueTaskTitle = `${TEST_TAG_PREFIX}Ship Edge Cache`;
    await input.fill(`todo: ${uniqueTaskTitle} @today #cloud-revamp`);

    // Verify summary pill
    await expect(page.getByText(new RegExp(`Task: "${uniqueTaskTitle}"`, 'i'))).toBeVisible();

    // Submit
    await page.keyboard.press('Enter');
    await expect(page.getByText(new RegExp(`Created task "${uniqueTaskTitle}"`, 'i'))).toBeVisible();

    // Navigate to Tasks and verify appearance
    await page.goto('/tasks');
    await expect(page.getByText(uniqueTaskTitle)).toBeVisible();
  });

  test('Workflow 3: Promote Note to Project via Atomic RPC with Checklist Extraction', async ({ page }) => {
    await page.goto('/notes');

    // 1. Click Capture Idea
    await page.getByRole('button', { name: /Capture Idea/i }).click();

    // 2. Fill note with title and embedded checklist items
    const uniqueNoteTitle = `${TEST_TAG_PREFIX}AI Agent Pipeline`;
    await page.getByPlaceholder(/Idea title/i).fill(uniqueNoteTitle);
    await page.getByPlaceholder(/Write freeform thoughts or markdown checklists/i).fill(
      `Exploring agentic orchestration.\n- [ ] Define agent roles\n- [ ] Connect MCP server`
    );
    await page.getByRole('button', { name: /Save Idea/i }).click();

    // 3. Verify Note card renders
    await expect(page.getByText(uniqueNoteTitle)).toBeVisible();

    // 4. Trigger "Promote to Project" modal
    const noteCard = page.locator('div', { hasText: uniqueNoteTitle }).first();
    await noteCard.getByRole('button', { name: /Promote to Project/i }).click();

    // 5. Confirm promotion in modal
    await expect(page.getByText(/Promote Idea to Project/i)).toBeVisible();
    await page.getByRole('button', { name: /Confirm Promotion/i }).click();

    // 6. Verify toast feedback and navigate to Projects
    await expect(page.getByText(/Successfully promoted to/i)).toBeVisible({ timeout: 5000 });

    await page.goto('/projects');
    await expect(page.getByText(uniqueNoteTitle)).toBeVisible();
  });
});
