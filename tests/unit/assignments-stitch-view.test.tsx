import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AssignmentsView } from '@/components/assignments/assignments-view';
import type { AssignmentWithProject } from '@/lib/actions/assignments';

describe('Assignments Stitch Rebuild Suite', () => {
  beforeEach(() => {
    // Monday of the same week as a1's due date (Fri Nov 20, 2026)
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
    expect(html).toContain('Due date');
    expect(html).toContain('Course');
    expect(html).toContain('Board');
    expect(html).toContain('List');

    // Section headings in default Due Date mode
    expect(html).toContain('Overdue');
    expect(html).toContain('Due This Week');
    expect(html).toContain('Later');

    // Calm empty state when overdue is 0
    expect(html).toContain('No overdue assignments');
    expect(html).toContain('All caught up!');

    // Preserves assignment title and subject badge
    expect(html).toContain('Data Structures Lab 4');
    expect(html).toContain('CS 201');

    // Contains no <tr> outside a <table>
    const nonTableHtml = html.replace(/<table[\s\S]*?<\/table>/gi, '');
    expect(nonTableHtml).not.toContain('<tr');
  });

  it('correctly handles overdue dates in Asia/Kolkata without disagreeing with Next Deadline or showing UTC Nov 20', () => {
    // Set clock after due date (Nov 22, 2026)
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));

    const singleFixture: AssignmentWithProject[] = [
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
        created_at: '2026-11-01T00:00:00Z',
        updated_at: '2026-11-01T00:00:00Z',
        project: null,
      },
    ];

    const html = renderToString(
      <AssignmentsView
        initialAssignments={singleFixture}
        projects={[]}
        userTimezone="Asia/Kolkata"
      />
    );

    // Overdue row renders local date Nov 21, NOT UTC Nov 20
    expect(html).toContain('Nov 21');
    expect(html).toContain('(Overdue)');
    expect(html).not.toContain('Nov 20');

    // Next Deadline card renders calm empty state because there are no upcoming deadlines >= today
    expect(html).toContain('Nothing coming up');
    expect(html).toContain('All caught up with coursework');

    // Next Deadline and Overdue count never disagree
    expect(html).toContain('1 overdue');

    // Rendered HTML contains no <tr> outside a <table>
    const nonTableHtml = html.replace(/<table[\s\S]*?<\/table>/gi, '');
    expect(nonTableHtml).not.toContain('<tr');
  });
});
