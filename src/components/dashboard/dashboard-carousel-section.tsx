import React from 'react';
import { getFinancialAnalytics, type FinancialAnalytics } from '@/lib/actions/finances';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';
import { getTasks, type TaskWithProject } from '@/lib/actions/tasks';
import { getProjectsWithMetrics, type ProjectWithMetrics } from '@/lib/actions/projects';
import { getNotes, type NoteWithProject } from '@/lib/actions/notes';
import { buildDashboardCards } from './minimal-carousel';
import { DashboardCarouselClient } from './dashboard-carousel-client';
import { DashboardCarouselSkeleton } from './dashboard-carousel-skeleton';

export { DashboardCarouselSkeleton };

export async function DashboardCarouselSection() {
  let analytics: FinancialAnalytics = getFallbackFinancialAnalytics();
  let tasks: TaskWithProject[] = [];
  let projects: ProjectWithMetrics[] = [];
  let notes: NoteWithProject[] = [];

  try {
    const results = await Promise.all([
      getFinancialAnalytics(),
      getTasks(),
      getProjectsWithMetrics(),
      getNotes(),
    ]);
    analytics = results[0] || analytics;
    tasks = Array.isArray(results[1]) ? results[1] : [];
    projects = Array.isArray(results[2]) ? results[2] : [];
    notes = Array.isArray(results[3]) ? results[3] : [];
  } catch (err) {
    console.error('Error fetching dashboard carousel section data:', err);
  }

  const cards = buildDashboardCards({
    analytics,
    tasks,
    projects,
    notes,
  });

  return <DashboardCarouselClient cards={cards} />;
}
