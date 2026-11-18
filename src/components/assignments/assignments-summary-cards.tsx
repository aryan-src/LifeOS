'use client';

import React from 'react';
import { Award, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import type { AssignmentSummaryMetrics } from '@/lib/assignments/derived';
import { StatCard } from '@/components/ui/stat-card';

interface AssignmentsSummaryCardsProps {
  metrics: AssignmentSummaryMetrics;
  letterGrade: string | null;
}

export function AssignmentsSummaryCards({
  metrics,
  letterGrade,
}: AssignmentsSummaryCardsProps) {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      data-purpose="assignments-summary-cards"
    >
      <StatCard
        label="Total Tracked"
        value={metrics.total}
        icon={<BookOpen className="h-4 w-4" />}
        sublabel={`Across ${metrics.moduleCount} academic ${
          metrics.moduleCount === 1 ? 'module' : 'modules'
        }`}
      />

      <StatCard
        label="Pending"
        value={metrics.pendingSubmission}
        badge={
          metrics.dueSoon48h > 0
            ? { text: `${metrics.dueSoon48h} due in 48h`, tone: 'tertiary', dot: true }
            : undefined
        }
        icon={<Clock className="h-4 w-4 text-on-tertiary-container" />}
        sublabel={
          metrics.pendingSubmission === 0
            ? 'All deliverables submitted'
            : 'Open coursework awaiting submission'
        }
      />

      <StatCard
        label="Submitted & Done"
        value={metrics.completed}
        icon={<CheckCircle2 className="h-4 w-4 text-secondary" />}
        sublabel="Turned in or officially evaluated"
      />

      <StatCard
        label="Graded Average"
        value={metrics.avgPercentage !== null ? `${metrics.avgPercentage}%` : '—'}
        badge={letterGrade ? { text: letterGrade, tone: 'secondary' } : undefined}
        icon={<Award className="h-4 w-4" />}
        sublabel={
          metrics.gradedCount > 0
            ? `Based on ${metrics.gradedCount} evaluated ${
                metrics.gradedCount === 1 ? 'assessment' : 'assessments'
              }`
            : 'No graded items yet'
        }
      />
    </section>
  );
}
