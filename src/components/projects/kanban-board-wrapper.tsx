'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { ProjectWithMetrics } from '@/lib/actions/projects';

// CRITICAL: Bypass Next.js server rendering completely for the Drag-and-Drop
// client boundary to eliminate all mount jitter and hydration mismatches.
const DynamicKanbanBoardClient = dynamic(
  () =>
    import('./kanban-board-client').then((mod) => mod.KanbanBoardClient),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-96 rounded-xl border border-surface-container-high bg-surface-container-low p-4"
          >
            <div className="h-5 w-24 bg-surface-container-high rounded mb-4" />
            <div className="h-32 bg-surface-container-lowest/60 rounded-xl" />
          </div>
        ))}
      </div>
    ),
  }
);

interface KanbanBoardWrapperProps {
  initialProjects: ProjectWithMetrics[];
}

export function KanbanBoardWrapper({ initialProjects }: KanbanBoardWrapperProps) {
  return <DynamicKanbanBoardClient initialProjects={initialProjects} />;
}
