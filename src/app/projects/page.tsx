import React from 'react';
import { Shell } from '@/components/layout/shell';
import { KanbanBoardWrapper } from '@/components/projects/kanban-board-wrapper';
import { getProjectsWithMetrics } from '@/lib/actions/projects';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getProjectsWithMetrics();

  return (
    <Shell>
      <div className="w-full">
        <KanbanBoardWrapper initialProjects={projects} />
      </div>
    </Shell>
  );
}

