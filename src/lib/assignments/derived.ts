import type { AssignmentWithProject } from '@/lib/actions/assignments';
import { daysBetweenDateStrings } from '@/lib/daily-loop/business-logic';
import { dueDateToCalendarDate, APP_TIMEZONE } from '@/lib/utils/date';

export interface AssignmentSummaryMetrics {
  total: number;
  moduleCount: number;
  pendingSubmission: number;
  dueSoon48h: number;
  completed: number;
  gradedCount: number;
  avgPercentage: number | null;
}

export function computeAssignmentSummary(
  assignments: AssignmentWithProject[],
  todayDateStr: string,
  timeZone: string = APP_TIMEZONE
): AssignmentSummaryMetrics {
  const modules = new Set<string>();
  let pendingSubmission = 0;
  let dueSoon48h = 0;
  let completed = 0;
  let gradedCount = 0;
  let totalAchieved = 0;
  let totalMax = 0;

  for (const item of assignments) {
    if (item.subject?.trim()) {
      modules.add(item.subject.trim());
    }

    const isDone = item.status === 'submitted' || item.status === 'graded';
    if (isDone) {
      completed += 1;
    } else {
      pendingSubmission += 1;
      if (item.due_date) {
        const dueDay = dueDateToCalendarDate(item.due_date, timeZone);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dueDay)) {
          const diff = daysBetweenDateStrings(todayDateStr, dueDay);
          if (diff >= 0 && diff <= 2) {
            dueSoon48h += 1;
          }
        }
      }
    }

    if (
      item.status === 'graded' &&
      typeof item.marks_achieved === 'number' &&
      typeof item.total_marks === 'number' &&
      item.total_marks > 0
    ) {
      gradedCount += 1;
      totalAchieved += item.marks_achieved;
      totalMax += item.total_marks;
    }
  }

  const avgPercentage =
    totalMax > 0 ? Math.round((totalAchieved / totalMax) * 100) : null;

  return {
    total: assignments.length,
    moduleCount: modules.size,
    pendingSubmission,
    dueSoon48h,
    completed,
    gradedCount,
    avgPercentage,
  };
}
