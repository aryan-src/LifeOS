import React from 'react';
import type { Metadata } from 'next';
import { KanbanBoardWrapper } from '@/components/projects/kanban-board-wrapper';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import type { ViewMode } from '@/components/projects/projects-view-client';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Kanban boards, high-density lists, and roadmap timelines for personal and academic initiatives.',
};

export const dynamic = 'force-dynamic';

interface ProjectsPageProps {
  searchParams?: Promise<{ view?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawView = resolvedParams?.view;
  const initialView: ViewMode =
    rawView && ['board', 'list', 'timeline'].includes(rawView)
      ? (rawView as ViewMode)
      : 'board';

  const projects = await getProjectsWithMetrics();

  return (
    <div className="flex flex-col w-full">
      <div className="w-full">
        <KanbanBoardWrapper
          initialProjects={projects}
          initialView={initialView}
        />
      </div>
    </div>
  );
}
