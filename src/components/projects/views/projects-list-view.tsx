'use client';

import React from 'react';
import Link from 'next/link';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import type { ProjectStatus } from '@/types/database.types';
import { STATUS_CONFIG, PRIORITY_CONFIG, getDaysRemaining } from '../project-helpers';
import { formatNumber } from '@/lib/utils/format';
import {
  Edit3,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Inbox,
  CheckSquare,
} from 'lucide-react';

interface ProjectsListViewProps {
  projects: ProjectWithMetrics[];
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onDelete: (projectId: string) => void;
  onEdit: (project: ProjectWithMetrics) => void;
  onNewProject: () => void;
}

export function ProjectsListView({
  projects,
  onStatusChange,
  onDelete,
  onEdit,
  onNewProject,
}: ProjectsListViewProps) {
  if (projects.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-400 dark:text-zinc-500 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">No projects found</h3>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-sm">
          No projects match your current filters. Initiate a new project or adjust your search.
        </p>
        <button
          type="button"
          onClick={onNewProject}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#22332a] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-50/80 dark:bg-zinc-900/80 border-b border-stone-200/60 dark:border-zinc-800/80 text-stone-500 dark:text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-3.5 font-semibold w-10 text-center" scope="col">
                #
              </th>
              <th className="py-3 px-4 font-semibold min-w-[260px]" scope="col">
                Project &amp; Description
              </th>
              <th className="py-3 px-3 font-semibold min-w-[120px]" scope="col">
                Status
              </th>
              <th className="py-3 px-3 font-semibold min-w-[150px]" scope="col">
                Task Completion
              </th>
              <th className="py-3 px-3 font-semibold min-w-[140px]" scope="col">
                Budget Burn
              </th>
              <th className="py-3 px-3 font-semibold min-w-[140px]" scope="col">
                Target Date
              </th>
              <th className="py-3 px-3 font-semibold min-w-[100px]" scope="col">
                Priority
              </th>
              <th className="py-3 px-4 font-semibold w-28 text-right" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
            {projects.map((project, idx) => {
              const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG[2];
              const daysInfo = getDaysRemaining(project.target_date);
              const totalTasks = project.total_tasks || 0;
              const completedTasks = project.completed_tasks || 0;
              const completionPct =
                totalTasks > 0
                  ? Math.round((completedTasks / totalTasks) * 100)
                  : project.completion_percentage || 0;

              const budget = Number(project.budget) || 0;
              const spend = Number(project.total_spend) || 0;
              const isOverBudget = budget > 0 && spend > budget;

              return (
                <tr
                  key={project.id}
                  className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                >
                  {/* Row index */}
                  <td className="py-3.5 px-3.5 text-center text-stone-400 dark:text-zinc-500 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Title, description & slug */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-stone-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {project.title}
                        </span>
                        {project.slug && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded">
                            {`#${project.slug}`}
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-stone-500 dark:text-zinc-400 text-xs mt-0.5 line-clamp-1 max-w-sm">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-3">
                    <div className="relative inline-block">
                      <select
                        aria-label={`Status for ${project.title}`}
                        value={project.status}
                        onChange={(e) =>
                          onStatusChange(project.id, e.target.value as ProjectStatus)
                        }
                        className={`text-xs font-medium rounded-full px-2.5 py-1 pr-6 cursor-pointer appearance-none transition-colors focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600 ${
                          STATUS_CONFIG[project.status]?.badgeClass || ''
                        }`}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-stone-500 dark:text-zinc-400">
                        <span className="text-[10px]">▾</span>
                      </div>
                    </div>
                  </td>

                  {/* Task Completion */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1 max-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-stone-700 dark:text-zinc-300 font-semibold">
                          {`${completionPct}%`}
                        </span>
                        <span className="text-stone-400 dark:text-zinc-500 text-[10px]">
                          {`${completedTasks}/${totalTasks} tasks`}
                        </span>
                      </div>
                      <div className="w-full bg-stone-200/70 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 dark:bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(completionPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Budget Burn */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      {isOverBudget && (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold ${
                            isOverBudget
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-stone-800 dark:text-zinc-200'
                          }`}
                        >
                          {`₹${formatNumber(spend)}`}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                          {`of ₹${formatNumber(budget)} allocated`}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Target Date */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px] text-stone-700 dark:text-zinc-300">
                        {project.target_date || '—'}
                      </span>
                      <span
                        className={`inline-block w-fit text-[10px] px-1.5 py-0.2 rounded font-mono ${daysInfo.badgeClass}`}
                      >
                        {daysInfo.label}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] rounded-md font-mono ${priority.badgeClass}`}
                    >
                      {priority.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Promote Note / Notes Link */}
                      <Link
                        href={`/notes?project=${project.id}`}
                        title="View project notes & sparks"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Link>

                      {/* Edit Modal */}
                      <button
                        type="button"
                        onClick={() => onEdit(project)}
                        title="Edit project"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDelete(project.id)}
                        title="Delete project"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
