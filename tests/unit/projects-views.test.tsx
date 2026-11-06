import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ProjectsViewClient } from '@/components/projects/projects-view-client';
import { ProjectsBoardView } from '@/components/projects/views/projects-board-view';
import { ProjectsListView } from '@/components/projects/views/projects-list-view';
import { ProjectsTimelineView } from '@/components/projects/views/projects-timeline-view';
import { getDaysRemaining } from '@/components/projects/project-helpers';
import type { ProjectWithMetrics } from '@/lib/actions/projects';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => null,
  }),
}));

const mockProjects: ProjectWithMetrics[] = [
  {
    id: 'proj-1',
    user_id: 'usr-1',
    title: 'HandTracker',
    slug: 'handtracker',
    description: 'A program to control/use macbooks via hand gestures in air',
    status: 'backlog',
    priority: 2,
    start_date: null,
    target_date: null,
    budget: 0,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    total_tasks: 0,
    completed_tasks: 0,
    completion_percentage: 0,
    total_spend: 0,
  },
  {
    id: 'proj-2',
    user_id: 'usr-1',
    title: 'LifeOS',
    slug: 'lifeos',
    description: 'An effort to facilitate all the necessary trackers a student or engineer needs',
    status: 'active',
    priority: 3,
    start_date: '2026-10-20',
    target_date: '2026-12-18',
    budget: 5000,
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-20T10:00:00Z',
    total_tasks: 2,
    completed_tasks: 1,
    completion_percentage: 50,
    total_spend: 1200,
  },
  {
    id: 'proj-3',
    user_id: 'usr-1',
    title: 'SnapGuide',
    slug: 'snapguide',
    description: 'A website from which anyone can learn to click good photos from phone',
    status: 'paused',
    priority: 2,
    start_date: '2026-11-01',
    target_date: '2026-11-26',
    budget: 2000,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    total_tasks: 0,
    completed_tasks: 0,
    completion_percentage: 0,
    total_spend: 2500, // over budget
  },
  {
    id: 'proj-4',
    user_id: 'usr-1',
    title: 'HTML Academy',
    slug: 'html-academy',
    description: 'A website created to make boring HTML notes into an interactive game',
    status: 'completed',
    priority: 2,
    start_date: '2026-10-01',
    target_date: '2026-10-28',
    budget: 1000,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-28T10:00:00Z',
    total_tasks: 4,
    completed_tasks: 4,
    completion_percentage: 100,
    total_spend: 800,
  },
];

describe('Projects Module Multi-View Suite', () => {
  describe('getDaysRemaining Utility', () => {
    it('returns "No deadline" when target date is null', () => {
      const res = getDaysRemaining(null);
      expect(res.days).toBeNull();
      expect(res.label).toBe('No deadline');
    });

    it('handles future and overdue target dates correctly', () => {
      const futureRes = getDaysRemaining('2099-12-31');
      expect(futureRes.days).toBeGreaterThan(0);
      expect(futureRes.label).toContain('left');

      const pastRes = getDaysRemaining('2000-01-01');
      expect(pastRes.days).toBeLessThan(0);
      expect(pastRes.label).toContain('Overdue');
    });
  });

  describe('ProjectsViewClient Orchestrator', () => {
    it('renders Header, View Switcher tablist with Board, List, and Timeline tabs', () => {
      const html = renderToString(
        <ProjectsViewClient initialProjects={mockProjects} initialView="board" />
      );

      expect(html).toContain('Projects');
      expect(html).toContain('Board View');
      expect(html).toContain('List View');
      expect(html).toContain('Timeline');
      expect(html).toContain('New Project');
    });

    it('renders KPI metrics correctly across the portfolio', () => {
      const html = renderToString(
        <ProjectsViewClient initialProjects={mockProjects} initialView="board" />
      );

      // Active Workstreams: 1 (LifeOS)
      expect(html).toContain('Active Workstreams');
      expect(html).toContain('Across Domains');

      // Overall Velocity: (0 + 50 + 0 + 100) / 4 = 37.5 -> 38%
      expect(html).toContain('Overall Velocity');
      expect(html).toContain('38%');

      // Completed / Q4: 1 (HTML Academy)
      expect(html).toContain('Completed / Q4');
      expect(html).toContain('Achieved');

      // Stalled Items: 1 (SnapGuide)
      expect(html).toContain('Stalled Items');
      expect(html).toContain('On hold');
    });

    it('handles empty projects list with divide-by-zero protection', () => {
      const html = renderToString(
        <ProjectsViewClient initialProjects={[]} initialView="board" />
      );

      // Should safely display 0% velocity and 0 counts without NaN
      expect(html).toContain('0%');
      expect(html).not.toContain('NaN');
    });

    it('renders toolbar filter dropdowns and search input', () => {
      const html = renderToString(
        <ProjectsViewClient initialProjects={mockProjects} initialView="board" />
      );

      expect(html).toContain('Filter:');
      expect(html).toContain('All Statuses');
      expect(html).toContain('All Priorities');
      expect(html).toContain('Search projects, tags, slugs...');
      expect(html).toContain('4 projects displayed');
    });
  });

  describe('ProjectsBoardView (Kanban)', () => {
    it('renders 4 status columns: Backlog, Active, Paused, Completed', () => {
      const html = renderToString(
        <ProjectsBoardView
          projects={mockProjects}
          onStatusChange={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          onNewProject={vi.fn()}
        />
      );

      expect(html).toContain('Backlog');
      expect(html).toContain('Active');
      expect(html).toContain('Paused');
      expect(html).toContain('Completed');

      // Card items
      expect(html).toContain('HandTracker');
      expect(html).toContain('LifeOS');
      expect(html).toContain('SnapGuide');
      expect(html).toContain('HTML Academy');

      // Slugs
      expect(html).toContain('#handtracker');
      expect(html).toContain('#lifeos');
    });

    it('renders progress bar, budget burn rate, and target countdowns', () => {
      const html = renderToString(
        <ProjectsBoardView
          projects={mockProjects}
          onStatusChange={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          onNewProject={vi.fn()}
        />
      );

      expect(html).toContain('1/2 tasks'); // LifeOS tasks
      expect(html).toContain('50%'); // LifeOS completion
      expect(html).toContain('₹1,200'); // Spend
      expect(html).toContain('₹5,000'); // Budget
      expect(html).toContain('Over budget'); // SnapGuide is over budget (2500 > 2000)
    });
  });

  describe('ProjectsListView (High-Density Table)', () => {
    it('renders table columns and project metadata', () => {
      const html = renderToString(
        <ProjectsListView
          projects={mockProjects}
          onStatusChange={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          onNewProject={vi.fn()}
        />
      );

      // Columns
      expect(html).toContain('Project &amp; Description');
      expect(html).toContain('Status');
      expect(html).toContain('Task Completion');
      expect(html).toContain('Budget Burn');
      expect(html).toContain('Target Date');
      expect(html).toContain('Priority');
      expect(html).toContain('Actions');

      // Status dropdowns
      expect(html).toContain('Backlog');
      expect(html).toContain('Active');
      expect(html).toContain('Paused');
      expect(html).toContain('Completed');

      // Promote Note / Notes Link
      expect(html).toContain('href="/notes?project=proj-2"');
    });

    it('renders divide-by-zero safe task counts (0/0 tasks)', () => {
      const html = renderToString(
        <ProjectsListView
          projects={mockProjects}
          onStatusChange={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          onNewProject={vi.fn()}
        />
      );

      expect(html).toContain('0/0 tasks');
      expect(html).not.toContain('NaN%');
    });
  });

  describe('ProjectsTimelineView (Roadmap / Gantt)', () => {
    it('renders quarter navigator, granularity tabs, and project milestone bars', () => {
      const html = renderToString(
        <ProjectsTimelineView
          projects={mockProjects}
          onStatusChange={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          onNewProject={vi.fn()}
        />
      );

      // Granularity
      expect(html).toContain('Months');
      expect(html).toContain('Weeks');
      expect(html).toContain('Days');
      expect(html).toContain('Today');

      // Left column label
      expect(html).toContain('Projects &amp; Deliverables');

      // Milestone bars
      expect(html).toContain('LifeOS');
      expect(html).toContain('HTML Academy');
      expect(html).toContain('SnapGuide');
      expect(html).toContain('HandTracker');
    });

    it('renders empty state when filtered project list is empty', () => {
      const html = renderToString(
        <ProjectsTimelineView
          projects={[]}
          onStatusChange={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          onNewProject={vi.fn()}
        />
      );

      expect(html).toContain('No projects found');
      expect(html).toContain('New Project');
    });
  });
});
