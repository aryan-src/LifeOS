import React from 'react';
import type { Metadata } from 'next';
import { KanbanBoardWrapper } from '@/components/projects/kanban-board-wrapper';
import { getProjectsWithMetrics } from '@/lib/actions/projects';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Kanban boards and milestone tracking for active academic and personal initiatives.',
};

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getProjectsWithMetrics();

  return (
    <div className="flex flex-col w-full">
      <div className="w-full">
        <KanbanBoardWrapper initialProjects={projects} />
      </div>
    </div>
  );
}

