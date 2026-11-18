import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AssignmentsView } from '@/components/assignments/assignments-view';
import type { AssignmentWithProject } from '@/lib/actions/assignments';

describe('Assignments Stitch Rebuild Suite', () => {
  const mockAssignments: AssignmentWithProject[] = [
    {
      id: 'a1',
      user_id: 'user-1',
      subject: 'CS 201',
      title: 'Data Structures Lab 4',
      due_date: '2026-11-20T23:59:00Z',
      status: 'in_progress',
      project_id: null,
      marks_achieved: null,
      total_marks: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project: null,
    },
    {
      id: 'a2',
      user_id: 'user-1',
      subject: 'MATH 220',
      title: 'Calculus Review Problem Set',
      due_date: '2026-12-15T23:59:00Z',
      status: 'not_started',
      project_id: null,
      marks_achieved: null,
      total_marks: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project: null,
    },
  ];

  it('renders Stitch Playfair page title, view switcher tabs, and Overdue / Due This Week / Upcoming Later sections', () => {
    const html = renderToString(
      <AssignmentsView initialAssignments={mockAssignments} projects={[]} />
    );

    // Page title and typography
    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('Assignments');

    // Switcher tabs
    expect(html).toContain('By Due Date');
    expect(html).toContain('By Course');
    expect(html).toContain('Board');
    expect(html).toContain('List');

    // Section headings in default By Due Date mode
    expect(html).toContain('Overdue');
    expect(html).toContain('Due This Week');
    expect(html).toContain('Upcoming Later');

    // Calm empty state when overdue is 0
    expect(html).toContain('No overdue assignments');
    expect(html).toContain('All caught up!');

    // Preserves assignment title and subject badge
    expect(html).toContain('Data Structures Lab 4');
    expect(html).toContain('CS 201');
  });
});
