'use client';

import React, { useState, useOptimistic, useTransition, useMemo } from 'react';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import type { AssignmentStatus } from '@/types/database.types';
import {
  createAssignment,
  updateAssignmentStatus,
  gradeAssignment,
  updateAssignment,
  deleteAssignment,
} from '@/lib/actions/assignments';
import { AssignmentCard } from './assignment-card';
import { AssignmentRow } from './assignment-row';
import { AssignmentModal } from './assignment-modal';
import { GradeModal } from './grade-modal';
import {
  Kanban,
  List,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

interface ProjectOption {
  id: string;
  title: string;
  slug: string;
}

interface AssignmentsViewProps {
  initialAssignments: AssignmentWithProject[];
  projects: ProjectOption[];
}

type OptimisticAction =
  | { type: 'status'; id: string; status: AssignmentStatus }
  | {
      type: 'grade';
      id: string;
      marks_achieved: number;
      total_marks: number;
    }
  | { type: 'delete'; id: string }
  | { type: 'create'; assignment: AssignmentWithProject }
  | { type: 'update'; assignment: AssignmentWithProject };

const STATUS_COLUMNS: Array<{
  id: AssignmentStatus;
  label: string;
  badgeClass: string;
  columnClass: string;
}> = [
  {
    id: 'not_started',
    label: 'Not Started',
    badgeClass: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    columnClass: 'border-stone-200/70 dark:border-stone-800',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    columnClass: 'border-sky-200/60 dark:border-sky-900/40',
  },
  {
    id: 'submission_pending',
    label: 'Submission Pending',
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800',
    columnClass: 'border-amber-300/80 bg-amber-50/20 dark:border-amber-700/60 dark:bg-amber-950/10',
  },
  {
    id: 'submitted',
    label: 'Submitted',
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
    columnClass: 'border-emerald-200/60 dark:border-emerald-900/40',
  },
  {
    id: 'graded',
    label: 'Graded',
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
    columnClass: 'border-emerald-200/60 dark:border-emerald-900/40',
  },
];

export function AssignmentsView({
  initialAssignments,
  projects,
}: AssignmentsViewProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithProject | null>(null);
  const [gradingAssignment, setGradingAssignment] = useState<AssignmentWithProject | null>(null);

  const [, startTransition] = useTransition();

  // Optimistic assignments state
  const [optimisticAssignments, setOptimisticAssignments] = useOptimistic(
    initialAssignments,
    (state: AssignmentWithProject[], action: OptimisticAction) => {
      switch (action.type) {
        case 'status':
          return state.map((item) =>
            item.id === action.id ? { ...item, status: action.status } : item
          );
        case 'grade':
          return state.map((item) =>
            item.id === action.id
              ? {
                  ...item,
                  status: 'graded' as AssignmentStatus,
                  marks_achieved: action.marks_achieved,
                  total_marks: action.total_marks,
                }
              : item
          );
        case 'delete':
          return state.filter((item) => item.id !== action.id);
        case 'create':
          return [action.assignment, ...state];
        case 'update':
          return state.map((item) =>
            item.id === action.assignment.id ? { ...action.assignment } : item
          );
        default:
          return state;
      }
    }
  );

  // Distinct subjects for filter dropdown
  const subjects = useMemo(() => {
    const set = new Set<string>();
    optimisticAssignments.forEach((a) => {
      if (a.subject) set.add(a.subject);
    });
    return Array.from(set).sort();
  }, [optimisticAssignments]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return optimisticAssignments.filter((a) => {
      // Search query filter (matches title or subject)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesSubject = a.subject.toLowerCase().includes(query);
        const matchesProject = a.project?.title?.toLowerCase().includes(query) ||
                               a.project?.slug?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubject && !matchesProject) return false;
      }

      // Subject filter
      if (selectedSubject !== 'all' && a.subject !== selectedSubject) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && a.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [optimisticAssignments, searchQuery, selectedSubject, selectedStatus]);

  // Metrics
  const metrics = useMemo(() => {
    const total = optimisticAssignments.length;
    const pendingSubmission = optimisticAssignments.filter(
      (a) => a.status === 'submission_pending'
    ).length;
    const completed = optimisticAssignments.filter(
      (a) => a.status === 'submitted' || a.status === 'graded'
    ).length;

    const gradedItems = optimisticAssignments.filter(
      (a) =>
        a.status === 'graded' &&
        a.marks_achieved !== null &&
        a.total_marks !== null &&
        a.total_marks > 0
    );

    let avgPercentage: number | null = null;
    if (gradedItems.length > 0) {
      const sum = gradedItems.reduce((acc, curr) => {
        return acc + ((curr.marks_achieved || 0) / (curr.total_marks || 1)) * 100;
      }, 0);
      avgPercentage = Math.round(sum / gradedItems.length);
    }

    return {
      total,
      pendingSubmission,
      completed,
      avgPercentage,
    };
  }, [optimisticAssignments]);

  // Handlers
  const handleStatusChange = (id: string, status: AssignmentStatus) => {
    setErrorMessage(null);
    startTransition(async () => {
      setOptimisticAssignments({ type: 'status', id, status });
      const res = await updateAssignmentStatus(id, status);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update assignment status');
      }
    });
  };

  const handleDelete = (id: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      setOptimisticAssignments({ type: 'delete', id });
      const res = await deleteAssignment(id);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete assignment');
      }
    });
  };

  const handleGradeSubmit = async (id: string, marksAchieved: number, totalMarks: number) => {
    setErrorMessage(null);

    startTransition(async () => {
      setOptimisticAssignments({
        type: 'grade',
        id,
        marks_achieved: marksAchieved,
        total_marks: totalMarks,
      });

      const res = await gradeAssignment(id, marksAchieved, totalMarks);

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to save grade');
      }
    });
  };

  const handleSaveAssignment = async (data: import('@/lib/actions/assignments').CreateAssignmentInput, id?: string) => {
    setErrorMessage(null);
    const targetProject = data.project_id
      ? projects.find((p) => p.id === data.project_id) || null
      : null;

    if (id) {
      // Edit mode
      const existing = optimisticAssignments.find((a) => a.id === id);
      if (existing) {
        const updated: AssignmentWithProject = {
          ...existing,
          ...data,
          due_date: data.due_date || null,
          status: data.status || existing.status,
          project_id: data.project_id || null,
          marks_achieved: data.marks_achieved !== undefined ? data.marks_achieved : existing.marks_achieved,
          total_marks: data.total_marks !== undefined ? data.total_marks : existing.total_marks,
          project: targetProject ? { id: targetProject.id, title: targetProject.title, slug: targetProject.slug } : null,
        };

        startTransition(async () => {
          setOptimisticAssignments({ type: 'update', assignment: updated });
          const res = await updateAssignment(id, data);
          if (!res.success) {
            setErrorMessage(res.error || 'Failed to update assignment');
          }
        });
      }
    } else {
      // Create mode
      const tempId = `temp-${Date.now()}`;
      const newAssignment: AssignmentWithProject = {
        id: tempId,
        user_id: '',
        subject: data.subject,
        title: data.title,
        due_date: data.due_date || null,
        status: data.status || 'not_started',
        project_id: data.project_id || null,
        marks_achieved: data.marks_achieved || null,
        total_marks: data.total_marks || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project: targetProject ? { id: targetProject.id, title: targetProject.title, slug: targetProject.slug } : null,
      };

      startTransition(async () => {
        setOptimisticAssignments({ type: 'create', assignment: newAssignment });
        const res = await createAssignment(data);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to create assignment');
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="font-mono text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Academics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Assignment Tracker
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Track coursework deadlines, prioritize pending submissions, and record assignment grades.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Kanban size={13} />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>

          {/* New Assignment Button */}
          <button
            type="button"
            onClick={() => {
              setEditingAssignment(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Metric Cards (Notion-style, breathable) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Total Tracked</span>
            <BookOpen size={14} className="text-stone-400" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
            {metrics.total}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Across all subjects</div>
        </div>

        {/* Submission Pending - Warm Amber Highlight */}
        <div className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 shadow-xs ring-1 ring-amber-400/20">
          <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 mb-1 font-medium">
            <span>Submission Pending</span>
            <Clock size={14} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-amber-950 dark:text-amber-200 font-mono">
            {metrics.pendingSubmission}
          </div>
          <div className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1">
            Work done • Needs submission
          </div>
        </div>

        {/* Submitted / Done */}
        <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-1 font-medium">
            <span>Submitted & Done</span>
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-200 font-mono">
            {metrics.completed}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-1">
            Turned in or evaluated
          </div>
        </div>

        {/* Graded Average */}
        <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Graded Average</span>
            <Award size={14} className="text-stone-400" />
          </div>
          <div className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
            {metrics.avgPercentage !== null ? `${metrics.avgPercentage}%` : '—'}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {metrics.avgPercentage !== null ? 'Across graded assignments' : 'No graded items yet'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900/50 p-2 sm:p-2.5 rounded-2xl border border-stone-200/70 dark:border-stone-800">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search assignments by title, subject, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter size={13} className="text-stone-400 shrink-0" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200/60 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-stone-200/60 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="submission_pending">Submission Pending</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
          </select>
        </div>
      </div>

      {/* Main Content: Kanban vs Table View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {STATUS_COLUMNS.map((column) => {
            const columnItems = filteredAssignments.filter((a) => a.status === column.id);

            return (
              <div
                key={column.id}
                className={`flex flex-col rounded-2xl border ${column.columnClass} p-3 sm:p-3.5 min-h-[360px] bg-stone-50/40 dark:bg-stone-900/30`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/60 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {column.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${column.badgeClass}`}
                    >
                      {columnItems.length}
                    </span>
                  </div>

                  {column.id === 'submission_pending' && columnItems.length > 0 && (
                    <span className="flex h-2 w-2 relative" title="Action required">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                  )}
                </div>

                {/* Cards List */}
                <div className="flex flex-col gap-3 flex-1">
                  {columnItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800/80 text-stone-400 text-xs italic">
                      No assignments
                    </div>
                  ) : (
                    columnItems.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onStatusChange={handleStatusChange}
                        onGradeClick={(a) => setGradingAssignment(a)}
                        onEditClick={(a) => {
                          setEditingAssignment(a);
                          setIsCreateOpen(true);
                        }}
                        onDeleteClick={handleDelete}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-density List / Table View */
        <div className="overflow-x-auto rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/70 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 text-stone-500 dark:text-stone-400 text-[11px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3 sm:px-4 font-medium">Subject</th>
                <th className="py-2.5 px-3 sm:px-4 font-medium">Assignment</th>
                <th className="py-2.5 px-3 sm:px-4 font-medium">Due Date</th>
                <th className="py-2.5 px-3 sm:px-4 font-medium">Status</th>
                <th className="py-2.5 px-3 sm:px-4 font-medium">Marks</th>
                <th className="py-2.5 px-3 sm:px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-stone-400 italic">
                    No assignments found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    onStatusChange={handleStatusChange}
                    onGradeClick={(a) => setGradingAssignment(a)}
                    onEditClick={(a) => {
                      setEditingAssignment(a);
                      setIsCreateOpen(true);
                    }}
                    onDeleteClick={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AssignmentModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingAssignment(null);
        }}
        initialAssignment={editingAssignment}
        projects={projects}
        onSubmit={handleSaveAssignment}
      />

      {gradingAssignment && (
        <GradeModal
          isOpen={Boolean(gradingAssignment)}
          onClose={() => setGradingAssignment(null)}
          assignment={gradingAssignment}
          onGrade={handleGradeSubmit}
        />
      )}
    </div>
  );
}
