import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { ProjectCreateModal } from '@/components/projects/project-create-modal';

// Mock server actions
vi.mock('@/lib/actions/projects', () => ({
  createProject: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'proj-123',
      user_id: 'user-1',
      title: 'Operating System Revision',
      slug: 'operating-system-revision',
      description: 'Study virtual memory and paging algorithms',
      status: 'active',
      priority: 2,
      budget: 1500,
      start_date: '2026-11-10',
      target_date: '2026-12-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  }),
}));

describe('Initiate New Project Modal (Redesigned Notion/Linear Aesthetic)', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={false} onClose={vi.fn()} />
    );
    expect(html).toBe('');
  });

  it('renders modal container, backdrop scrim, and ambient highlight when isOpen is true', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    // 1. Backdrop Scrim Overlay
    expect(html).toContain('data-purpose="modal-overlay"');
    expect(html).toContain('bg-stone-950/30');
    expect(html).toContain('backdrop-blur-[6px]');

    // 2. Modal Canvas Card
    expect(html).toContain('data-purpose="initiate-project-modal"');
    expect(html).toContain('bg-[#FAF9F5]');
    expect(html).toContain('shadow-2xl');
    expect(html).toContain('rounded-2xl');

    // 3. Ambient 1px Highlight Accent Bar
    expect(html).toContain('from-emerald-500/0 via-emerald-600/40 to-teal-500/0');

    // 4. Header & Icon Tile
    expect(html).toContain('Initiate New Project');
    expect(html).toContain('bg-emerald-50');
    expect(html).toContain('text-emerald-700');
    expect(html).toContain('id="close-modal-btn"');
  });

  it('renders high-priority project title input with autoFocus and required attributes', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('id="project-title"');
    expect(html).toContain('name="title"');
    expect(html).toContain('placeholder="Enter project title..."');
    expect(html).toContain('font-semibold');
    expect(html).toContain('text-base');
  });

  it('renders 5-option interactive segmented status selector', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} defaultStatus="active" />
    );

    expect(html).toContain('data-purpose="status-segmented-control"');
    expect(html).toContain('Backlog');
    expect(html).toContain('Planning');
    expect(html).toContain('Active');
    expect(html).toContain('Paused');
    expect(html).toContain('Completed');

    // Emerald dot indicator for Active state
    expect(html).toContain('bg-[#10B981]');
  });

  it('renders 4-grid priority tier selector with badges and icons', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('data-purpose="priority-selector"');
    expect(html).toContain('P1 Urgent');
    expect(html).toContain('P2 High');
    expect(html).toContain('P3 Medium');
    expect(html).toContain('P4 Low');

    // Rose, amber, emerald, and stone color palettes
    expect(html).toContain('border-rose-200');
    expect(html).toContain('border-amber-200');
    expect(html).toContain('border-emerald-300');
    expect(html).toContain('border-stone-200');
  });

  it('renders target deadline date picker and allocated budget row', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} currencySymbol="₹" />
    );

    // Target Deadline
    expect(html).toContain('id="target-deadline"');
    expect(html).toContain('placeholder="dd/mm/yyyy"');

    // Allocated Budget
    expect(html).toContain('id="allocated-budget"');
    expect(html).toContain('name="budget"');
    expect(html).toContain('font-mono');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('₹');
  });

  it('renders description & scope textarea with hairline styling', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('id="project-scope"');
    expect(html).toContain('name="description"');
    expect(html).toContain('High-level objectives, deliverables, and requirements...');
  });

  it('renders action footer with keyboard shortcuts and buttons', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    // Global shortcut indicator
    expect(html).toContain('⌘ / Ctrl + ↵');

    // Cancel Button
    expect(html).toContain('id="cancel-btn"');
    expect(html).toContain('Cancel');

    // Create Project CTA Button
    expect(html).toContain('id="submit-project-btn"');
    expect(html).toContain('Create Project');
    expect(html).toContain('bg-stone-900');
  });

  it('is re-exported identically from project-create-modal.tsx', () => {
    const htmlA = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );
    const htmlB = renderToString(
      <ProjectCreateModal isOpen={true} onClose={vi.fn()} />
    );

    expect(htmlA).toBe(htmlB);
  });
});
