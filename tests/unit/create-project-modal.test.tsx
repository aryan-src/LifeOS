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

vi.mock('@/lib/actions/tasks', () => ({
  createTask: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'task-123',
      title: 'Discovery & Wireframes',
    },
  }),
}));

describe('Initiate New Project Modal (Split 2-Column Sidebar Layout)', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={false} onClose={vi.fn()} />
    );
    expect(html).toBe('');
  });

  it('renders modal container with 2-column sidebar layout, backdrop scrim, and ambient highlight', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    // 1. Backdrop Scrim Overlay
    expect(html).toContain('data-purpose="modal-overlay"');
    expect(html).toContain('bg-stone-950/30');
    expect(html).toContain('backdrop-blur-[6px]');

    // 2. Modal Canvas Card (Variant 1: Split 2-Column Sidebar Layout)
    expect(html).toContain('data-purpose="initiate-project-modal"');
    expect(html).toContain('max-w-4xl');
    expect(html).toContain('bg-[#FAF9F5]');
    expect(html).toContain('shadow-2xl');
    expect(html).toContain('rounded-2xl');
    expect(html).toContain('flex-col md:flex-row');

    // 3. Ambient 1px Highlight Accent Bar
    expect(html).toContain('from-emerald-500/0 via-emerald-600/40 to-teal-500/0');
  });

  it('renders Left Column with Hero Header, Project Breakdown Milestones, and AI Smart Assist', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    // Hero Header in Left Sidebar
    expect(html).toContain('Initiate New Project');
    expect(html).toContain('LifeOS Workstream');
    expect(html).toContain('bg-emerald-50');
    expect(html).toContain('text-emerald-700');

    // Project Breakdown
    expect(html).toContain('Project Breakdown');
    expect(html).toContain('Discovery &amp; Wireframes');
    expect(html).toContain('Audits, user journeys &amp; component specs');
    expect(html).toContain('Add Custom Milestone');

    // AI Smart Assist (BETA)
    expect(html).toContain('AI Smart Assist');
    expect(html).toContain('BETA');
    expect(html).toContain('Generate structured milestones from title &amp; scope in one click.');
    expect(html).toContain('3-Sprint Agile sequence');
    expect(html).toContain('Discovery → MVP → Launch');
    expect(html).toContain('Auto-generate Phases');
  });

  it('renders Right Column Header with Project Specifications and accessible close button', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('Project Specifications');
    expect(html).toContain('id="close-modal-btn"');
    expect(html).toContain('aria-label="Close dialog"');
  });

  it('renders high-priority project title input with autoFocus and required attributes', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('id="project-title"');
    expect(html).toContain('name="title"');
    expect(html).toContain('placeholder="e.g. Operating System Revision"');
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
    expect(html).toContain('placeholder="0.00"');
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
