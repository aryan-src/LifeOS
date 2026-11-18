import { describe, it, expect } from 'vitest';
import { computeAssignmentSummary } from '../../src/lib/assignments/derived';
import type { AssignmentWithProject } from '../../src/lib/actions/assignments';

const sample: AssignmentWithProject[] = [
  {
    id: 'a-1',
    user_id: 'u-1',
    subject: 'CS 201',
    title: 'Lab 4',
    due_date: '2026-11-19',
    status: 'in_progress',
    project_id: null,
    marks_achieved: null,
    total_marks: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    project: null,
  },
  {
    id: 'a-2',
    user_id: 'u-1',
    subject: 'MATH 102',
    title: 'Midterm Problem Set',
    due_date: '2026-11-10',
    status: 'graded',
    project_id: null,
    marks_achieved: 45,
    total_marks: 50,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-12T00:00:00Z',
    project: null,
  },
];

describe('Assignments Derived Helper', () => {
  it('computes pending, due within 48h, completed, and weighted graded average', () => {
    const res = computeAssignmentSummary(sample, '2026-11-18');
    expect(res.total).toBe(2);
    expect(res.moduleCount).toBe(2);
    expect(res.pendingSubmission).toBe(1);
    expect(res.dueSoon48h).toBe(1);
    expect(res.completed).toBe(1);
    expect(res.gradedCount).toBe(1);
    expect(res.avgPercentage).toBe(90);
  });

  it('returns calm zero defaults when list is empty', () => {
    const res = computeAssignmentSummary([], '2026-11-18');
    expect(res.total).toBe(0);
    expect(res.avgPercentage).toBeNull();
  });
});
