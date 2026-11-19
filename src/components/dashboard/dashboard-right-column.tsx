'use client';

import React from 'react';
import Link from 'next/link';
import { ClipboardList, Folder, Lightbulb, ArrowRight } from 'lucide-react';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import type { NoteWithProject } from '@/lib/actions/notes';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { ProgressBar } from '@/components/ui/progress-bar';
import { EmptyState } from '@/components/ui/empty-state';

interface DashboardRightColumnProps {
  assignments: AssignmentWithProject[];
  projects: ProjectWithMetrics[];
  notes: NoteWithProject[];
  onOpenQuickCapture: (prefix: string) => void;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function DashboardRightColumn({
  assignments,
  projects,
  notes,
  onOpenQuickCapture,
}: DashboardRightColumnProps) {
  const pendingAssignments = assignments.filter(
    (a) => a.status !== 'graded' && a.status !== 'submitted'
  );
  const displayAssignments = pendingAssignments.slice(0, 3);

  const activeProjects = projects.filter(
    (p) => p.status === 'active' || p.status === 'backlog'
  );
  const displayProjects = activeProjects.slice(0, 3);

  const recentIdeas = notes.slice(0, 2);

  return (
    <div className="lg:col-span-3 space-y-6 min-w-0">
      {/* Assignments Card */}
      <Card
        as="article"
        padding="md"
        surface="lowest"
        className="flex flex-col justify-between gap-3"
        data-purpose="submissions-card"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
            <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
              Assignments
            </h2>
          </div>
          <Link
            href="/assignments"
            className="font-mono text-label-sm text-on-surface-variant transition-colors hover:text-secondary"
            style={LINING_NUMS_STYLE}
          >
            {pendingAssignments.length} due
          </Link>
        </div>

        {displayAssignments.length === 0 ? (
          <EmptyState
            compact={true}
            title="No pending submissions"
            description="All coursework and assignments are up to date."
          />
        ) : (
          <div className="space-y-2">
            {displayAssignments.map((assignment) => (
              <Link
                key={assignment.id}
                href="/assignments"
                className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-2.5 transition-colors hover:bg-surface-container"
              >
                <div className="min-w-0">
                  <p className="truncate font-sans text-body-sm font-medium text-on-surface">
                    {assignment.title}
                  </p>
                  <span
                    className="font-mono text-[11px] text-on-surface-variant"
                    style={LINING_NUMS_STYLE}
                  >
                    {assignment.due_date ? `Due ${assignment.due_date.slice(0, 10)}` : 'No due date'}
                  </span>
                </div>
                <Pill tone="tertiary">Pending</Pill>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Projects Card */}
      <Card
        as="article"
        padding="md"
        surface="lowest"
        className="flex flex-col justify-between gap-3"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
            <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
              Projects
            </h2>
          </div>
          <Link
            href="/projects"
            className="font-mono text-label-sm text-on-surface-variant transition-colors hover:text-secondary"
            style={LINING_NUMS_STYLE}
          >
            {activeProjects.length} active
          </Link>
        </div>

        {displayProjects.length === 0 ? (
          <EmptyState
            compact={true}
            title="No active projects"
            action={
              <Link
                href="/projects"
                className="font-mono text-label-sm font-medium text-secondary hover:underline"
              >
                Start a project →
              </Link>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {displayProjects.map((project) => {
              const total = project.total_tasks ?? 0;
              const completed = project.completed_tasks ?? 0;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href="/projects"
                  className="block rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-3 transition-colors hover:bg-surface-container"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate font-sans text-body-sm font-medium text-on-surface">
                      {project.title}
                    </span>
                    <span
                      className="shrink-0 font-mono text-label-sm text-on-surface-variant"
                      style={LINING_NUMS_STYLE}
                    >
                      {completed}/{total} tasks
                    </span>
                  </div>
                  <ProgressBar
                    value={pct}
                    tone="secondary"
                    size="xs"
                    label={`${project.title} completion`}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Ideas Scratchpad Card */}
      <Card
        as="article"
        padding="md"
        surface="lowest"
        className="flex flex-1 flex-col justify-between gap-3 min-w-0"
        data-purpose="projects-ideas-card"
      >
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-on-tertiary-container" aria-hidden="true" />
              <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
                Ideas
              </h2>
            </div>
            <Link
              href="/notes"
              className="font-mono text-label-sm text-on-surface-variant transition-colors hover:text-secondary"
            >
              Notes →
            </Link>
          </div>

          {recentIdeas.length === 0 ? (
            <EmptyState
              compact={true}
              title="No ideas recorded yet."
              description="Jot a quick thought and it routes directly to your Notes stream."
            />
          ) : (
            <div className="space-y-2">
              {recentIdeas.map((note) => (
                <Link
                  key={note.id}
                  href="/notes"
                  className="block rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-2.5 transition-colors hover:bg-surface-container"
                >
                  <p className="truncate font-sans text-body-sm font-medium text-on-surface">
                    {note.title || 'Untitled note'}
                  </p>
                  {note.content && (
                    <p className="mt-0.5 line-clamp-2 font-sans text-[12px] text-on-surface-variant">
                      {note.content}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenQuickCapture('Note: ')}
          className="mt-1 flex w-full items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 font-sans text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
        >
          <span>Capture a thought...</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-on-primary">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>
      </Card>
    </div>
  );
}
