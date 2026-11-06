'use client';

import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import type { ProjectStatus } from '@/types/database.types';
import { STATUS_CONFIG, PRIORITY_CONFIG, getDaysRemaining } from '../project-helpers';
import { formatNumber } from '@/lib/utils/format';
import { Plus, CheckSquare, Calendar, Trash2, Edit3, Inbox, AlertTriangle } from 'lucide-react';

interface ProjectsBoardViewProps {
  projects: ProjectWithMetrics[];
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onDelete: (projectId: string) => void;
  onEdit: (project: ProjectWithMetrics) => void;
  onNewProject: (defaultStatus?: ProjectStatus) => void;
}

const COLUMNS: { id: ProjectStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'active', title: 'Active' },
  { id: 'paused', title: 'Paused' },
  { id: 'completed', title: 'Completed' },
];

export function ProjectsBoardView({
  projects,
  onStatusChange,
  onDelete,
  onEdit,
  onNewProject,
}: ProjectsBoardViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    onStatusChange(draggableId, newStatus);
  };

  return (
    <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
      {isMounted ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-[1020px] items-start">
            {COLUMNS.map((column) => {
              const columnConfig = STATUS_CONFIG[column.id];
              const columnProjects = projects.filter((p) => p.status === column.id);

              return (
                <div
                  key={column.id}
                  className="flex flex-col bg-stone-100/60 dark:bg-zinc-900/40 border border-stone-200/60 dark:border-zinc-800/60 rounded-2xl p-2.5"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${columnConfig.dotClass}`} />
                      <span className="text-xs font-semibold text-stone-800 dark:text-zinc-200">
                        {column.title}
                      </span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${columnConfig.badgeClass}`}>
                        {columnProjects.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNewProject(column.id)}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition"
                      title={`Add project to ${column.title}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Droppable Column */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-2.5 flex-1 min-h-[360px] rounded-xl p-1 transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-stone-200/50 dark:bg-zinc-800/40 ring-1 ring-stone-300 dark:ring-zinc-700'
                            : ''
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
                                  opacity: draggableSnapshot.isDragging ? 0.9 : 1,
                                }}
                              >
                                <BoardProjectCard
                                  project={project}
                                  onDelete={onDelete}
                                  onEdit={onEdit}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {columnProjects.length === 0 && (
                          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-stone-200 dark:border-zinc-800 rounded-xl text-stone-400 dark:text-zinc-500 gap-1.5 my-auto">
                            <Inbox className="w-5 h-5 text-stone-300 dark:text-zinc-600" />
                            <span className="text-xs">No cards yet</span>
                            <button
                              type="button"
                              onClick={() => onNewProject(column.id)}
                              className="text-[11px] font-medium text-[#2A4B3D] dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              + Add project
                            </button>
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
        /* SSR Fallback */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-[1020px] items-start">
          {COLUMNS.map((column) => {
            const columnConfig = STATUS_CONFIG[column.id];
            const columnProjects = projects.filter((p) => p.status === column.id);

            return (
              <div
                key={column.id}
                className="flex flex-col bg-stone-100/60 dark:bg-zinc-900/40 border border-stone-200/60 dark:border-zinc-800/60 rounded-2xl p-2.5"
              >
                <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${columnConfig.dotClass}`} />
                    <span className="text-xs font-semibold text-stone-800 dark:text-zinc-200">
                      {column.title}
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${columnConfig.badgeClass}`}>
                      {columnProjects.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 flex-1 min-h-[360px] p-1">
                  {columnProjects.map((project) => (
                    <BoardProjectCard
                      key={project.id}
                      project={project}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  ))}
                  {columnProjects.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-stone-200 dark:border-zinc-800 rounded-xl text-stone-400 dark:text-zinc-500 gap-1.5 my-auto">
                      <Inbox className="w-5 h-5 text-stone-300 dark:text-zinc-600" />
                      <span className="text-xs">No cards yet</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BoardProjectCard({
  project,
  onDelete,
  onEdit,
}: {
  project: ProjectWithMetrics;
  onDelete: (id: string) => void;
  onEdit: (project: ProjectWithMetrics) => void;
}) {
  const priorityInfo = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG[2];
  const isOverBudget = project.budget > 0 && project.total_spend > project.budget;
  const deadlineInfo = getDaysRemaining(project.target_date);
  // Divide-by-zero safeguard
  const completionPercentage =
    project.total_tasks > 0
      ? Math.round((project.completed_tasks / project.total_tasks) * 100)
      : project.completion_percentage || 0;

  return (
    <article
      data-purpose="project-board-card"
      onClick={() => onEdit(project)}
      className="group relative p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-stone-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-sm hover:border-stone-300 dark:hover:border-zinc-700 transition cursor-pointer flex flex-col gap-2.5"
    >
      {/* Top Header: Priority Badge & Slug */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-md ${priorityInfo.badgeClass}`}>
          {priorityInfo.label}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
          {`#${project.slug}`}
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-stone-900 dark:text-zinc-100 group-hover:text-[#2A4B3D] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1 pt-0.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-stone-400 dark:text-zinc-500">Progress</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {`${completionPercentage}%`}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Meta Footer: Tasks, Budget & Deadline */}
      <div className="pt-2 border-t border-stone-100 dark:border-zinc-800/60 flex flex-col gap-1.5 text-[11px] font-mono text-stone-500 dark:text-zinc-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <CheckSquare className="w-3 h-3 text-stone-400 dark:text-zinc-500" />
            <span>
              {`${project.completed_tasks}/${project.total_tasks} tasks`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span
              suppressHydrationWarning
              className={
                isOverBudget
                  ? 'text-rose-600 dark:text-rose-400 font-semibold inline-flex items-center gap-0.5'
                  : ''
              }
            >
              {isOverBudget && (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[10px] mr-1">Over budget:</span>
                </>
              )}
              {`₹${formatNumber(project.total_spend)} / ₹${formatNumber(project.budget)}`}
            </span>
          </div>
        </div>

        {/* Deadline Badge */}
        {project.target_date && (
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-stone-400 dark:text-zinc-500 inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {project.target_date}
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded ${deadlineInfo.badgeClass}`}>
              {deadlineInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* Floating Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 rounded-lg p-0.5 shadow-xs border border-stone-200/60 dark:border-zinc-700/60">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project);
          }}
          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          title="Edit project"
        >
          <Edit3 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete project "${project.title}"?`)) {
              onDelete(project.id);
            }
          }}
          className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
          title="Delete project"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </article>
  );
}
