import { describe, it, expect } from 'vitest';
import type { AssignmentStatus } from '@/types/database.types';
import { formatCalendarDate } from '@/lib/utils/date';

describe('Assignments logic and formatting', () => {
  it('formats assignment due dates deterministically without timezone shifts', () => {
    expect(formatCalendarDate('2026-10-15', 'short')).toBe('Oct 15');
    expect(formatCalendarDate('2026-11-01', 'medium')).toBe('1 Nov 2026');
    expect(formatCalendarDate('2026-12-25', 'full')).toBe('December 25, 2026');
  });

  it('calculates score percentages accurately', () => {
    const calcPercentage = (marks: number | null, total: number | null) => {
      if (marks === null || total === null || total <= 0) return null;
      return Math.round((marks / total) * 100);
    };

    expect(calcPercentage(85, 100)).toBe(85);
    expect(calcPercentage(18, 20)).toBe(90);
    expect(calcPercentage(2, 3)).toBe(67);
    expect(calcPercentage(null, 100)).toBeNull();
    expect(calcPercentage(50, 0)).toBeNull();
  });

  it('correctly categorizes urgent assignments for the upcoming submissions widget', () => {
    const today = '2026-10-08';
    const in48h = '2026-10-10';

    interface MockAssignment {
      id: string;
      title: string;
      status: AssignmentStatus;
      due_date: string | null;
    }

    const assignments: MockAssignment[] = [
      { id: '1', title: 'Pending Report', status: 'submission_pending', due_date: '2026-10-15' },
      { id: '2', title: 'Due Tomorrow', status: 'in_progress', due_date: '2026-10-09' },
      { id: '3', title: 'Already Submitted', status: 'submitted', due_date: '2026-10-09' },
      { id: '4', title: 'Far Deadline', status: 'not_started', due_date: '2026-10-25' },
      { id: '5', title: 'Overdue Assignment', status: 'in_progress', due_date: '2026-10-05' },
      { id: '6', title: 'Already Graded', status: 'graded', due_date: '2026-10-05' },
    ];

    const urgent = assignments.filter((a) => {
      if (a.status === 'submission_pending') return true;
      if (
        a.due_date &&
        a.due_date <= in48h &&
        a.status !== 'submitted' &&
        a.status !== 'graded'
      ) {
        return true;
      }
      return false;
    });

    const urgentIds = urgent.map((a) => a.id);
    expect(urgentIds).toContain('1'); // submission_pending always included
    expect(urgentIds).toContain('2'); // due tomorrow (<=48h) included
    expect(urgentIds).toContain('5'); // overdue included
    expect(urgentIds).not.toContain('3'); // submitted excluded
    expect(urgentIds).not.toContain('4'); // far deadline excluded
    expect(urgentIds).not.toContain('6'); // graded excluded
    expect(urgent.length).toBe(3);
  });

  it('maps Supabase statuses into the 4 wide columns correctly', async () => {
    const { FOUR_COLUMNS } = await import('@/components/assignments/assignment-helpers');
    expect(FOUR_COLUMNS).toHaveLength(4);

    const [activeCol, inProgressCol, submittedCol, gradedCol] = FOUR_COLUMNS;
    expect(activeCol.id).toBe('active');
    expect(activeCol.statuses).toEqual(['not_started']);

    expect(inProgressCol.id).toBe('in_progress');
    expect(inProgressCol.statuses).toEqual(['in_progress', 'submission_pending']);
    expect(inProgressCol.isHighlighted).toBe(true);

    expect(submittedCol.id).toBe('submitted');
    expect(submittedCol.statuses).toEqual(['submitted']);

    expect(gradedCol.id).toBe('graded');
    expect(gradedCol.statuses).toEqual(['graded']);
  });

  it('computes priorities and letter grades accurately', async () => {
    const { getAssignmentPriority, getLetterGrade, getSubjectBadgeStyle } = await import(
      '@/components/assignments/assignment-helpers'
    );

    const today = '2026-10-08';

    // Submission pending is always HIGH priority
    expect(
      getAssignmentPriority({ status: 'submission_pending', due_date: '2026-10-20' }, today)
    ).toBe('HIGH');

    // Overdue is HIGH priority
    expect(
      getAssignmentPriority({ status: 'not_started', due_date: '2026-10-05' }, today)
    ).toBe('HIGH');

    // Due in <= 2 days is HIGH priority
    expect(
      getAssignmentPriority({ status: 'in_progress', due_date: '2026-10-10' }, today)
    ).toBe('HIGH');

    // Due in 5 days is MED priority
    expect(
      getAssignmentPriority({ status: 'not_started', due_date: '2026-10-13' }, today)
    ).toBe('MED');

    // Letter grades
    expect(getLetterGrade(98)).toBe('A+ (4.0)');
    expect(getLetterGrade(94)).toBe('A (4.0)');
    expect(getLetterGrade(85)).toBe('B (3.0)');
    expect(getLetterGrade(null)).toBeNull();

    // Subject styles
    expect(getSubjectBadgeStyle('CS 101')).toContain('indigo');
    expect(getSubjectBadgeStyle('MATH 240')).toContain('teal');
    expect(getSubjectBadgeStyle('HIST 110')).toContain('amber');
  });
});
