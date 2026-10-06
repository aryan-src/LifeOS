'use client';

import React from 'react';
import { KanbanBoardClient } from './kanban-board-client';
import type { ProjectWithMetrics } from '@/lib/actions/projects';

interface KanbanBoardWrapperProps {
  initialProjects: ProjectWithMetrics[];
}

export function KanbanBoardWrapper({ initialProjects }: KanbanBoardWrapperProps) {
  return <KanbanBoardClient initialProjects={initialProjects} />;
}
