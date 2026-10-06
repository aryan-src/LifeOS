'use client';

import React, { useOptimistic, useTransition, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { ProjectCard } from './project-card';
import {
  updateProjectStatus,
  deleteProject,
  createProject,
  type ProjectWithMetrics,
} from '@/lib/actions/projects';
import type { ProjectStatus } from '@/types/database.types';

interface KanbanBoardClientProps {
  initialProjects: ProjectWithMetrics[];
}

const COLUMNS: { id: ProjectStatus; title: string; dotClass: string; badgeClass: string }[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    dotClass: 'bg-outline',
    badgeClass: 'bg-surface-container-high text-on-surface-variant',
  },
  {
    id: 'active',
    title: 'Active',
    dotClass: 'bg-secondary',
    badgeClass: 'bg-secondary-container text-on-secondary-fixed-variant font-medium',
  },
  {
    id: 'paused',
    title: 'Paused',
    dotClass: 'bg-tertiary-fixed-dim',
    badgeClass: 'bg-surface-container-high text-on-surface-variant',
  },
  {
    id: 'completed',
    title: 'Completed',
    dotClass: 'bg-secondary',
    badgeClass: 'bg-secondary-container text-on-secondary-fixed-variant font-medium',
  },
];

export function KanbanBoardClient({ initialProjects }: KanbanBoardClientProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'timeline'>('board');
  const [isMounted, setIsMounted] = useState(false);
  const [, startTransition] = useTransition();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Optimistic board updates using React 19 useOptimistic
  const [optimisticProjects, setOptimisticProjects] = useOptimistic(
    initialProjects,
    (
      state,
      update:
        | { type: 'move'; projectId: string; newStatus: ProjectStatus }
        | { type: 'delete'; projectId: string }
    ) => {
      if (update.type === 'move') {
        return state.map((p) =>
          p.id === update.projectId ? { ...p, status: update.newStatus } : p
        );
      }
      if (update.type === 'delete') {
        return state.filter((p) => p.id !== update.projectId);
      }
      return state;
    }
  );

  // Compute calm editorial metrics
  const activeCount = optimisticProjects.filter((p) => p.status === 'active').length;
  const completedCount = optimisticProjects.filter((p) => p.status === 'completed').length;
  const pausedCount = optimisticProjects.filter((p) => p.status === 'paused').length;
  const avgVelocity =
    optimisticProjects.length > 0
      ? Math.round(
          optimisticProjects.reduce((acc, p) => acc + (p.completion_percentage || 0), 0) /
            optimisticProjects.length
        )
      : 0;

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as ProjectStatus;

    // React 19 instantaneous optimistic drag update
    startTransition(async () => {
      setOptimisticProjects({
        type: 'move',
        projectId: draggableId,
        newStatus,
      });

      const res = await updateProjectStatus(draggableId, newStatus);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to move project. Reverted.');
      }
    });
  };

  const handleDelete = (projectId: string) => {
    startTransition(async () => {
      setOptimisticProjects({ type: 'delete', projectId });
      const res = await deleteProject(projectId);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete project.');
      }
    });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sub-header / Context Ribbon */}
      <div className="px-space-lg py-space-lg bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-surface-container-high/60">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Projects</h1>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
              Q4 Roadmap
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Kanban roadmap, milestone tracking, and task completion metrics.
          </p>
        </div>

        {/* Controls Ribbon */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center p-0.5 bg-surface-container-high rounded">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-1.5 px-space-sm py-1 rounded font-body-sm text-body-sm transition-all ${
                activeTab === 'board'
                  ? 'bg-surface-container-lowest shadow-sm text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>Board View</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-space-sm py-1 rounded font-body-sm text-body-sm transition-all ${
                activeTab === 'list'
                  ? 'bg-surface-container-lowest shadow-sm text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              <span>List View</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-space-sm py-1 rounded font-body-sm text-body-sm transition-all ${
                activeTab === 'timeline'
                  ? 'bg-surface-container-lowest shadow-sm text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">timeline</span>
              <span>Timeline</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-outline-variant mx-1 hidden sm:block" />

          <button
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="flex items-center gap-1.5 px-space-md py-1.5 rounded bg-primary text-on-primary hover:opacity-90 font-body-sm text-body-sm font-medium transition-opacity"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Metric Strip (Calm editorial analytics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-container-high px-space-lg py-px">
        <div className="bg-surface-container-lowest p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              Active Workstreams
            </span>
            <span className="w-2 h-2 rounded-full bg-secondary" />
          </div>
          <div className="flex items-baseline gap-space-sm mt-space-sm">
            <span className="font-headline-lg text-headline-lg text-on-surface">{activeCount}</span>
            <span className="font-label-sm text-label-sm text-on-secondary-container">
              Across Domains
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              Overall Velocity
            </span>
            <span className="material-symbols-outlined text-[16px] text-outline">trending_up</span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-space-sm">
            <span className="font-headline-lg text-headline-lg text-on-surface">{avgVelocity}%</span>
            <span className="font-label-sm text-label-sm text-outline">Avg card pace</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              Completed / Q4
            </span>
            <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-space-sm">
            <span className="font-headline-lg text-headline-lg text-on-surface">{completedCount}</span>
            <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-1.5 py-0.5 rounded font-medium">
              Achieved
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              Stalled Items
            </span>
            <span className="material-symbols-outlined text-[16px] text-outline">pause_circle</span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-space-sm">
            <span className="font-headline-lg text-headline-lg text-on-surface">{pausedCount}</span>
            <span className="font-label-sm text-label-sm text-outline">On hold</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-space-lg mt-space-md flex items-center justify-between rounded-xl border border-error-container bg-error-container p-4 text-on-error-container">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Inline Create Project Form */}
      {isCreateOpen && (
        <div className="mx-space-lg mt-space-md p-space-lg bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">add_box</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Initiate New Project</h3>
            </div>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="text-outline hover:text-on-surface p-1 rounded"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <form
            action={async (formData: FormData) => {
              const res = await createProject(null, formData);
              if (res.success) {
                setIsCreateOpen(false);
              } else {
                setErrorMessage(res.error || 'Failed to create project.');
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline">Project Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. 'Operating System Revision'"
                  className="w-full bg-surface-container-low rounded-lg border border-outline-variant/40 px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline">Target Deadline</label>
                <input
                  name="targetDate"
                  type="date"
                  className="w-full bg-surface-container-low rounded-lg border border-outline-variant/40 px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-outline">Description & Scope</label>
              <textarea
                name="description"
                rows={2}
                placeholder="High-level objectives, deliverables, and requirements..."
                className="w-full bg-surface-container-low rounded-lg border border-outline-variant/40 p-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-outline">Priority:</span>
                  <select
                    name="priority"
                    defaultValue="2"
                    className="bg-surface-container-low rounded-lg border border-outline-variant/40 px-2.5 py-1.5 font-label-sm text-label-sm text-on-surface focus:outline-none"
                  >
                    <option value="4">P1 - Urgent</option>
                    <option value="3">P2 - High</option>
                    <option value="2">P3 - Medium</option>
                    <option value="1">P4 - Low</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-outline">Budget (₹):</span>
                  <input
                    name="budget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue="0"
                    className="w-28 bg-surface-container-low rounded-lg border border-outline-variant/40 px-2.5 py-1.5 font-label-sm text-label-sm text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg px-4 py-1.5 font-body-sm text-body-sm text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 font-body-sm text-body-sm font-medium text-on-primary hover:opacity-90 transition-opacity"
                >
                  Create Project
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Board Container */}
      <div className="p-space-lg w-full overflow-x-auto">
        {isMounted ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md min-w-[1020px]">
              {COLUMNS.map((column) => {
                const columnProjects = optimisticProjects.filter(
                  (p) => p.status === column.id
                );

                return (
                  <div
                    key={column.id}
                    className="flex flex-col bg-surface-container-low rounded-xl p-space-sm"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-space-xs py-space-sm mb-space-xs">
                      <div className="flex items-center gap-space-sm">
                        <span className={`w-2 h-2 rounded-full ${column.dotClass}`} />
                        <span className="font-headline-sm text-headline-sm text-on-surface font-medium">
                          {column.title}
                        </span>
                        <span
                          className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded ${column.badgeClass}`}
                        >
                          {columnProjects.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors"
                        title={`Add card to ${column.title}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex flex-col gap-space-sm flex-1 min-h-[350px] rounded-lg p-1 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-surface-container-high/50' : ''
                          }`}
                        >
                          {columnProjects.map((project, index) => (
                            <Draggable
                              key={project.id}
                              draggableId={project.id}
                              index={index}
                            >
                              {(draggableProvided, draggableSnapshot) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  style={{
                                    ...draggableProvided.draggableProps.style,
                                    opacity: draggableSnapshot.isDragging ? 0.85 : 1,
                                  }}
                                >
                                  <ProjectCard
                                    project={project}
                                    onDelete={handleDelete}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {columnProjects.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-outline-variant/50 rounded-lg text-outline">
                              <span className="material-symbols-outlined text-[24px] mb-1">
                                inbox
                              </span>
                              <span className="font-label-sm text-label-sm">No cards yet</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md min-w-[1020px]">
            {COLUMNS.map((column) => {
              const columnProjects = optimisticProjects.filter(
                (p) => p.status === column.id
              );

              return (
                <div
                  key={column.id}
                  className="flex flex-col bg-surface-container-low rounded-xl p-space-sm"
                >
                  <div className="flex items-center justify-between px-space-xs py-space-sm mb-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <span className={`w-2 h-2 rounded-full ${column.dotClass}`} />
                      <span className="font-headline-sm text-headline-sm text-on-surface font-medium">
                        {column.title}
                      </span>
                      <span
                        className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded ${column.badgeClass}`}
                      >
                        {columnProjects.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-sm flex-1 min-h-[350px] rounded-lg p-1">
                    {columnProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onDelete={handleDelete}
                      />
                    ))}

                    {columnProjects.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-6 border border-dashed border-outline-variant/50 rounded-lg text-outline">
                        <span className="material-symbols-outlined text-[24px] mb-1">
                          inbox
                        </span>
                        <span className="font-label-sm text-label-sm">No cards yet</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
