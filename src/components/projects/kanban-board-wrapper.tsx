'use client';

import React from 'react';
import { ProjectsViewClient, type ViewMode } from './projects-view-client';
import type { ProjectWithMetrics } from '@/lib/actions/projects';

interface KanbanBoardWrapperProps {
  initialProjects: ProjectWithMetrics[];
  initialView?: ViewMode;
}

export function KanbanBoardWrapper({
  initialProjects,
  initialView = 'board',
}: KanbanBoardWrapperProps) {
  return (
    <ProjectsViewClient
      initialProjects={initialProjects}
      initialView={initialView}
    />
  );
}
