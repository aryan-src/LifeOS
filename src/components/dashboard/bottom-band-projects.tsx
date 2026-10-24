import React from 'react';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import { ActiveProjectsWidget } from '@/components/projects/active-projects-widget';

interface BottomBandProjectsProps {
  projects: ProjectWithMetrics[];
  className?: string;
}

export function BottomBandProjects({ projects, className = '' }: BottomBandProjectsProps) {
  return (
    <ActiveProjectsWidget
      projects={projects}
      className={`h-full ${className}`}
    />
  );
}
