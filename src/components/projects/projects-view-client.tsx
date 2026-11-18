'use client';

import React, { useState, useOptimistic, useTransition, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import {
  updateProjectStatus,
  deleteProject,
} from '@/lib/actions/projects';
import type { ProjectStatus } from '@/types/database.types';
import { ProjectsBoardView } from './views/projects-board-view';
import { ProjectsListView } from './views/projects-list-view';
import { ProjectsTimelineView } from './views/projects-timeline-view';
import { ProjectCreateModal } from './project-create-modal';
import { ProjectEditModal } from './project-edit-modal';
import { StatCard } from '@/components/ui/stat-card';
import {
  Kanban,
  List,
  CalendarRange,
  Plus,
  Search,
  TrendingUp,
  CheckCircle2,
  PauseCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ViewMode = 'board' | 'list' | 'timeline';

interface ProjectsViewClientProps {
  initialProjects: ProjectWithMetrics[];
  initialView?: ViewMode;
}

type OptimisticAction =
  | { type: 'move'; projectId: string; newStatus: ProjectStatus }
  | { type: 'edit'; project: Partial<ProjectWithMetrics> & { id: string } }
  | { type: 'delete'; projectId: string }
  | { type: 'add'; project: ProjectWithMetrics };

export function ProjectsViewClient({
  initialProjects,
  initialView = 'board',
}: ProjectsViewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine active view from searchParams or initialView
  const urlView = searchParams.get('view') as ViewMode | null;
  const [activeView, setActiveView] = useState<ViewMode>(
    urlView && ['board', 'list', 'timeline'].includes(urlView) ? urlView : initialView
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<number | 'all'>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<ProjectStatus>('active');
  const [editingProject, setEditingProject] = useState<ProjectWithMetrics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Optimistic State
  const [optimisticProjects, setOptimisticProjects] = useOptimistic(
    initialProjects,
    (state: ProjectWithMetrics[], action: OptimisticAction) => {
      switch (action.type) {
        case 'move':
          return state.map((p) =>
            p.id === action.projectId ? { ...p, status: action.newStatus } : p
          );
        case 'edit':
          return state.map((p) =>
            p.id === action.project.id ? { ...p, ...action.project } : p
          );
        case 'delete':
          return state.filter((p) => p.id !== action.projectId);
        case 'add':
          return [action.project, ...state];
        default:
          return state;
      }
    }
  );

  // Sync active view with URL query param without full page reload
  const handleViewChange = (view: ViewMode) => {
    setActiveView(view);
    const params = new URLSearchParams(window.location.search);
    params.set('view', view);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  };

  // Status Change Handler with 0ms optimistic latency
  const handleStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    startTransition(async () => {
      setOptimisticProjects({ type: 'move', projectId, newStatus });
      const res = await updateProjectStatus(projectId, newStatus);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update status.');
      }
    });
  };

  // Delete Handler with optimistic removal
  const handleDelete = (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    startTransition(async () => {
      setOptimisticProjects({ type: 'delete', projectId });
      const res = await deleteProject(projectId);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete project.');
      }
    });
  };

  // Edit Save Handler
  const handleEditSave = (updated: Partial<ProjectWithMetrics> & { id: string }) => {
    setOptimisticProjects({ type: 'edit', project: updated });
  };

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return optimisticProjects.filter((p) => {
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;

      // Search query (title, description, slug)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = p.title?.toLowerCase().includes(query);
        const descMatch = p.description?.toLowerCase().includes(query);
        const slugMatch = p.slug?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !slugMatch) return false;
      }

      return true;
    });
  }, [optimisticProjects, statusFilter, priorityFilter, searchQuery]);

  // Overall KPIs calculation (using full optimistic project list for accurate portfolio overview)
  const { activeCount, avgVelocity, completedCount, pausedCount } = useMemo(() => {
    const active = optimisticProjects.filter((p) => p.status === 'active').length;
    const completed = optimisticProjects.filter((p) => p.status === 'completed').length;
    const paused = optimisticProjects.filter((p) => p.status === 'paused').length;

    const velocity =
      optimisticProjects.length > 0
        ? Math.round(
            optimisticProjects.reduce((acc, p) => acc + (p.completion_percentage || 0), 0) /
              optimisticProjects.length
          )
        : 0;

    return {
      activeCount: active,
      avgVelocity: velocity,
      completedCount: completed,
      pausedCount: paused,
    };
  }, [optimisticProjects]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 md:px-8">
      {/* Stitch Projects Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-outline-variant/40 pb-5 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="font-serif text-page-title font-normal tracking-tight text-on-surface">
            Projects
          </h1>
          <p className="font-sans text-body-sm text-on-surface-variant">
            Milestones, roadmaps, task execution, and budget tracking.
          </p>
        </div>

        {/* View Switcher & Action CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Projects view mode"
            className="inline-flex items-center rounded-xl border border-outline-variant/50 bg-surface-container-low p-1 text-xs font-medium text-on-surface-variant"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'board'}
              onClick={() => handleViewChange('board')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
                activeView === 'board'
                  ? 'border border-outline-variant/40 bg-surface-container-lowest font-semibold text-on-surface shadow-xs'
                  : 'hover:text-on-surface'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Board View</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'list'}
              onClick={() => handleViewChange('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
                activeView === 'list'
                  ? 'border border-outline-variant/40 bg-surface-container-lowest font-semibold text-on-surface shadow-xs'
                  : 'hover:text-on-surface'
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              <span>List View</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'timeline'}
              onClick={() => handleViewChange('timeline')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
                activeView === 'timeline'
                  ? 'border border-outline-variant/40 bg-surface-container-lowest font-semibold text-on-surface shadow-xs'
                  : 'hover:text-on-surface'
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Timeline</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateDefaultStatus('active');
              setIsCreateOpen(true);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-secondary px-4 font-sans text-body-sm font-medium text-on-secondary shadow-xs transition-opacity hover:opacity-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Project</span>
          </button>
        </div>
      </header>

      {/* Stitch Metrics Ribbon (KPIs) */}
      <section
        aria-label="Project Key Performance Indicators"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Active Workstreams"
          value={activeCount}
          badge={{ text: 'Across Domains', tone: 'secondary', dot: true }}
        />

        <StatCard
          label="Overall Velocity"
          value={`${avgVelocity}%`}
          icon={<TrendingUp className="h-4 w-4 text-secondary" />}
          progress={{ value: avgVelocity, tone: 'secondary', label: 'Portfolio completion' }}
          sublabel="Avg card pace"
        />

        <StatCard
          label="Completed"
          value={completedCount}
          badge={{ text: 'Achieved', tone: 'secondary' }}
          icon={<CheckCircle2 className="h-4 w-4 text-secondary" />}
        />

        <StatCard
          label="Stalled Items"
          value={pausedCount}
          badge={{ text: 'On hold', tone: 'neutral' }}
          icon={<PauseCircle className="h-4 w-4 text-on-tertiary-container" />}
        />
      </section>

      {/* Toolbar & Filter Bar */}
      <section
        aria-label="Filter and search ribbon"
        className="flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1 font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
            <Filter className="h-3 w-3" aria-hidden="true" />
            Filter:
          </span>

          <select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
            className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-1.5 font-sans text-body-sm text-on-surface transition-colors focus:border-secondary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            aria-label="Filter by Priority"
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="px-3 py-1.5 bg-ivory dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 rounded-lg text-textMain dark:text-zinc-200 font-medium hover:border-textSubtle dark:hover:border-zinc-700 transition-colors focus:outline-none focus:ring-1 focus:ring-sage"
          >
            <option value="all">All Priorities</option>
            <option value="4">P1 - Urgent</option>
            <option value="3">P2 - High</option>
            <option value="2">P3 - Medium</option>
            <option value="1">P4 - Low</option>
          </select>
        </div>

        {/* Quick Search & Count */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-textSubtle dark:text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, tags, slugs..."
              className="w-full pl-8 pr-3 py-1.5 bg-ivory dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 rounded-lg text-xs placeholder:text-textSubtle dark:placeholder:text-zinc-500 text-textMain dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="hidden md:flex items-center text-stone-500 dark:text-zinc-400 text-[11px] font-mono whitespace-nowrap">
            {`${filteredProjects.length} projects displayed`}
          </div>
        </div>
      </section>

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Area with Framer Motion Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="w-full"
        >
          {activeView === 'board' && (
            <ProjectsBoardView
              projects={filteredProjects}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onEdit={(project) => setEditingProject(project)}
              onNewProject={(defStatus) => {
                setCreateDefaultStatus(defStatus || 'active');
                setIsCreateOpen(true);
              }}
            />
          )}

          {activeView === 'list' && (
            <ProjectsListView
              projects={filteredProjects}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onEdit={(project) => setEditingProject(project)}
              onNewProject={() => {
                setCreateDefaultStatus('active');
                setIsCreateOpen(true);
              }}
            />
          )}

          {activeView === 'timeline' && (
            <ProjectsTimelineView
              projects={filteredProjects}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onEdit={(project) => setEditingProject(project)}
              onNewProject={() => {
                setCreateDefaultStatus('active');
                setIsCreateOpen(true);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <ProjectCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultStatus={createDefaultStatus}
        onSuccess={(newProject) => {
          setOptimisticProjects({ type: 'add', project: newProject });
        }}
      />

      <ProjectEditModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleEditSave}
        onDelete={(id) => {
          setOptimisticProjects({ type: 'delete', projectId: id });
        }}
      />
    </div>
  );
}
