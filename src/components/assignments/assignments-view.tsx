'use client';

import React, { useState, useOptimistic, useTransition, useMemo, useEffect } from 'react';
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
  FOUR_COLUMNS,
  getAssignmentPriority,
  getLetterGrade,
  type PriorityLevel,
} from './assignment-helpers';
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
  Database,
  ExternalLink,
  ArrowUpDown,
} from 'lucide-react';
import { getTodayDate } from '@/lib/utils/date';

interface ProjectOption {
  id: string;
  title: string;
  slug: string;
}

interface AssignmentsViewProps {
  initialAssignments: AssignmentWithProject[];
  projects: ProjectOption[];
  initialError?: string | null;
  isSchemaMissing?: boolean;
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

type SortOption = 'due_asc' | 'due_desc' | 'title_asc' | 'score_desc';

export function AssignmentsView({
  initialAssignments,
  projects,
  initialError,
  isSchemaMissing = false,
}: AssignmentsViewProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('due_asc');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<AssignmentStatus>('not_started');
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

  // Global keyboard shortcut for ⌘N / Ctrl+N to open New Assignment modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setEditingAssignment(null);
        setCreateDefaultStatus('not_started');
        setIsCreateOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Distinct subjects for filter dropdown
  const subjects = useMemo(() => {
    const set = new Set<string>();
    optimisticAssignments.forEach((a) => {
      if (a.subject) set.add(a.subject);
    });
    return Array.from(set).sort();
  }, [optimisticAssignments]);

  const today = getTodayDate();

  // Filtered and Sorted assignments
  const filteredAssignments = useMemo(() => {
    const filtered = optimisticAssignments.filter((a) => {
      // Search query filter (matches title, subject, or project)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesSubject = a.subject.toLowerCase().includes(query);
        const matchesProject =
          a.project?.title?.toLowerCase().includes(query) ||
          a.project?.slug?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubject && !matchesProject) return false;
      }

      // Subject filter
      if (selectedSubject !== 'all' && a.subject !== selectedSubject) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all') {
        const p = getAssignmentPriority(a, today);
        if (p !== selectedPriority) return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && a.status !== selectedStatus) {
        return false;
      }

      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'due_asc') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      if (sortBy === 'due_desc') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return b.due_date.localeCompare(a.due_date);
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'score_desc') {
        const aScore =
          a.marks_achieved !== null && a.total_marks
            ? a.marks_achieved / a.total_marks
            : -1;
        const bScore =
          b.marks_achieved !== null && b.total_marks
            ? b.marks_achieved / b.total_marks
            : -1;
        return bScore - aScore;
      }
      return 0;
    });
  }, [
    optimisticAssignments,
    searchQuery,
    selectedSubject,
    selectedPriority,
    selectedStatus,
    sortBy,
    today,
  ]);

  // Dynamic KPI Metrics computation
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

    const uniqueSubjects = new Set(optimisticAssignments.map((a) => a.subject).filter(Boolean));

    // Urgent pending items (due today or overdue)
    const urgentPendingCount = optimisticAssignments.filter(
      (a) =>
        a.status === 'submission_pending' &&
        a.due_date &&
        a.due_date <= today
    ).length;

    return {
      total,
      pendingSubmission,
      completed,
      avgPercentage,
      gradedCount: gradedItems.length,
      moduleCount: uniqueSubjects.size,
      urgentPendingCount,
    };
  }, [optimisticAssignments, today]);

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

  const handleGradeSubmit = async (
    id: string,
    marksAchieved: number,
    totalMarks: number
  ) => {
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

  const handleSaveAssignment = async (
    data: import('@/lib/actions/assignments').CreateAssignmentInput,
    id?: string
  ) => {
    setErrorMessage(null);
    const targetProject = data.project_id
      ? projects.find((p) => p.id === data.project_id) || null
      : null;

    if (id) {
      const existing = optimisticAssignments.find((a) => a.id === id);
      if (existing) {
        const updated: AssignmentWithProject = {
          ...existing,
          ...data,
          due_date: data.due_date || null,
          status: data.status || existing.status,
          project_id: data.project_id || null,
          marks_achieved:
            data.marks_achieved !== undefined
              ? data.marks_achieved
              : existing.marks_achieved,
          total_marks:
            data.total_marks !== undefined ? data.total_marks : existing.total_marks,
          project: targetProject
            ? {
                id: targetProject.id,
                title: targetProject.title,
                slug: targetProject.slug,
              }
            : null,
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
        project: targetProject
          ? {
              id: targetProject.id,
              title: targetProject.title,
              slug: targetProject.slug,
            }
          : null,
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

  const openNewWithStatus = (status: AssignmentStatus) => {
    setEditingAssignment(null);
    setCreateDefaultStatus(status);
    setIsCreateOpen(true);
  };

  const letterGrade = getLetterGrade(metrics.avgPercentage);

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Top Header & Actions (Stitch Theme) */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          {/* Category Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-mono tracking-wider text-amber-800 dark:text-amber-300 uppercase font-semibold">
              Academics
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A] dark:text-stone-100">
            Assignment Tracker
          </h1>
          <p className="mt-1 text-sm text-[#7A766F] dark:text-stone-400 max-w-2xl leading-relaxed">
            Track coursework deadlines, prioritize pending submissions, and record assignment grades across all current modules.
          </p>
        </div>

        {/* View Mode & New Assignment Action Buttons */}
        <div className="flex items-center flex-wrap gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-stone-200/50 dark:bg-stone-800 rounded-xl border border-[#EAE6DF]/70 dark:border-stone-700/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-stone-900 text-[#1A1A1A] dark:text-stone-100 shadow-xs border border-stone-200/80 dark:border-stone-700 font-semibold cursor-default'
                  : 'text-[#7A766F] dark:text-stone-400 hover:text-[#1A1A1A] dark:hover:text-stone-100 cursor-pointer'
              }`}
            >
              <Kanban size={13} />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-stone-900 text-[#1A1A1A] dark:text-stone-100 shadow-xs border border-stone-200/80 dark:border-stone-700 font-semibold cursor-default'
                  : 'text-[#7A766F] dark:text-stone-400 hover:text-[#1A1A1A] dark:hover:text-stone-100 cursor-pointer'
              }`}
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>

          {/* Primary New Assignment Button */}
          <button
            type="button"
            onClick={() => {
              setEditingAssignment(null);
              setCreateDefaultStatus('not_started');
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1A1A1A] dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.98] text-white dark:text-stone-900 text-xs font-semibold rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Assignment</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-stone-700 dark:bg-stone-300 text-stone-200 dark:text-stone-800 rounded font-mono font-normal">
              ⌘N
            </kbd>
          </button>
        </div>
      </section>

      {/* Schema Missing Setup Banner */}
      {(isSchemaMissing ||
        (errorMessage &&
          errorMessage.includes('Database tables not found in schema'))) && (
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700/60 p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 shrink-0 mt-0.5">
                <Database size={18} />
              </span>
              <div>
                <h3 className="font-semibold text-sm text-amber-950 dark:text-amber-100">
                  Database Table Setup Required
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                  The{' '}
                  <code className="font-mono bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[11px]">
                    assignments
                  </code>{' '}
                  table is not yet created in your Supabase schema. Apply the migration script to enable assignment tracking.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRetrying(true);
                window.location.reload();
              }}
              disabled={isRetrying}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              {isRetrying ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          <div className="pt-2.5 border-t border-amber-200/60 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-300">
            <span>
              Run{' '}
              <code className="font-mono font-medium bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-[11px]">
                supabase/apply_assignments_cloud.sql
              </code>{' '}
              in the Supabase SQL Editor, or{' '}
              <code className="font-mono font-medium bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-[11px]">
                npx supabase db reset
              </code>{' '}
              for local CLI.
            </span>
            <a
              href="https://supabase.com/dashboard/project/xbxdpnrmsfkqmnodlwnm/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium underline hover:text-amber-950 dark:hover:text-amber-100 whitespace-nowrap self-start sm:self-auto"
            >
              <span>Open SQL Editor</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Standard Error Banner */}
      {errorMessage &&
        !errorMessage.includes('Database tables not found in schema') &&
        !isSchemaMissing && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

      {/* Upper KPI Summary Cards (Stitch Design) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tracked */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] dark:border-stone-800 shadow-xs flex flex-col justify-between group hover:border-stone-400/60 transition-all">
          <div className="flex items-center justify-between text-[#7A766F] dark:text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Tracked
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-stone-100 font-mono">
              {metrics.total}
            </div>
            <div className="text-xs text-[#7A766F] dark:text-stone-400 mt-1">
              Across {metrics.moduleCount} academic{' '}
              {metrics.moduleCount === 1 ? 'module' : 'modules'}
            </div>
          </div>
        </div>

        {/* Card 2: Submission Pending (Highlighted Amber) */}
        <div className="bg-[#FFFDF7] dark:bg-amber-950/20 rounded-2xl p-4 sm:p-5 border-2 border-amber-300 dark:border-amber-700/60 shadow-xs flex flex-col justify-between group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Submission Pending
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-stone-100 flex items-baseline gap-2 font-mono">
              <span>{metrics.pendingSubmission}</span>
              {metrics.urgentPendingCount > 0 && (
                <span className="text-xs font-normal text-amber-700 dark:text-amber-300 font-mono">
                  {metrics.urgentPendingCount} Due Soon
                </span>
              )}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300/90 mt-1 font-medium">
              Work complete • Final upload required
            </div>
          </div>
        </div>

        {/* Card 3: Submitted & Done (Soft Emerald) */}
        <div className="bg-[#FAFCFA] dark:bg-emerald-950/20 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs flex flex-col justify-between group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Submitted &amp; Done
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-stone-100 font-mono">
              {metrics.completed}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-1 font-medium">
              Turned in or officially evaluated
            </div>
          </div>
        </div>

        {/* Card 4: Graded Average */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] dark:border-stone-800 shadow-xs flex flex-col justify-between group hover:border-stone-400/60 transition-all">
          <div className="flex items-center justify-between text-[#7A766F] dark:text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Graded Average
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-stone-100 flex items-baseline gap-2 font-mono">
              <span>
                {metrics.avgPercentage !== null ? `${metrics.avgPercentage}%` : '—'}
              </span>
              {letterGrade && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-medium">
                  {letterGrade}
                </span>
              )}
            </div>
            <div className="text-xs text-[#7A766F] dark:text-stone-400 mt-1">
              {metrics.gradedCount > 0
                ? `Based on ${metrics.gradedCount} evaluated ${
                    metrics.gradedCount === 1 ? 'assessment' : 'assessments'
                  }`
                : 'No graded items yet'}
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar (Warm Cream/Charcoal Stitch Toolbar) */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl p-2.5 sm:p-3 border border-[#EAE6DF] dark:border-stone-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A766F] dark:text-stone-400"
          />
          <input
            type="text"
            placeholder="Search assignments by title, course code, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50/70 dark:bg-stone-800/60 border border-transparent rounded-xl text-[#1A1A1A] dark:text-stone-100 placeholder-[#7A766F] dark:placeholder-stone-400 focus:bg-white dark:focus:bg-stone-900 focus:border-stone-300 dark:focus:border-stone-700 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Badges & Sort Cluster */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Filter Label */}
          <div className="px-2.5 py-1.5 text-[#7A766F] dark:text-stone-400 flex items-center gap-1 border-r border-[#EAE6DF] dark:border-stone-800 pr-3">
            <Filter size={13} />
            <span className="font-medium text-[11px] uppercase tracking-wider">
              Filters
            </span>
          </div>

          {/* Subject Filter Pill */}
          <div className="relative inline-block text-left">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="appearance-none bg-stone-100/80 dark:bg-stone-800 hover:bg-stone-200/60 dark:hover:bg-stone-700 border border-transparent text-[#1A1A1A] dark:text-stone-200 font-medium py-1.5 pl-3 pr-7 rounded-xl text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter Pill */}
          <div className="relative inline-block text-left">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="appearance-none bg-stone-100/80 dark:bg-stone-800 hover:bg-stone-200/60 dark:hover:bg-stone-700 border border-transparent text-[#1A1A1A] dark:text-stone-200 font-medium py-1.5 pl-3 pr-7 rounded-xl text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              <option value="all">All Priorities</option>
              <option value="HIGH">High Priority (P1)</option>
              <option value="MED">Medium Priority (P2)</option>
              <option value="LOW">Low Priority (P3)</option>
            </select>
          </div>

          {/* Status Filter Pill */}
          <div className="relative inline-block text-left">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-stone-100/80 dark:bg-stone-800 hover:bg-stone-200/60 dark:hover:bg-stone-700 border border-transparent text-[#1A1A1A] dark:text-stone-200 font-medium py-1.5 pl-3 pr-7 rounded-xl text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="submission_pending">Submission Pending</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
            </select>
          </div>

          {/* Sort Pill */}
          <div className="relative inline-block text-left">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-stone-100/80 dark:bg-stone-800 hover:bg-stone-200/60 dark:hover:bg-stone-700 border border-transparent text-[#1A1A1A] dark:text-stone-200 font-medium py-1.5 pl-3 pr-7 rounded-xl text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              <option value="due_asc">Sort: Due Date (Earliest)</option>
              <option value="due_desc">Sort: Due Date (Latest)</option>
              <option value="title_asc">Sort: Title (A-Z)</option>
              <option value="score_desc">Sort: Highest Score</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Content: Kanban 4-Column Board vs Table List View */}
      {viewMode === 'kanban' ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start pb-8">
          {FOUR_COLUMNS.map((col) => {
            const columnItems = filteredAssignments.filter((a) =>
              col.statuses.includes(a.status)
            );

            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-2xl p-4 min-h-[600px] ${col.containerClass}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1.5 py-1 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${col.accentDot}`} />
                    <h2
                      className={`text-xs font-semibold tracking-wide ${
                        col.isHighlighted
                          ? 'text-amber-900 dark:text-amber-200'
                          : 'text-[#1A1A1A] dark:text-stone-200'
                      }`}
                    >
                      {col.title}
                    </h2>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-medium ${col.badgeClass}`}
                    >
                      {columnItems.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openNewWithStatus(col.defaultCreateStatus)}
                    className="text-[#7A766F] hover:text-[#1A1A1A] dark:hover:text-white text-lg leading-none p-1 transition-colors cursor-pointer"
                    title={`Add assignment to ${col.title}`}
                  >
                    +
                  </button>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-4 flex-1 flex flex-col">
                  {columnItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-stone-400 text-xs italic">
                      <p>No assignments in this column.</p>
                      <button
                        type="button"
                        onClick={() => openNewWithStatus(col.defaultCreateStatus)}
                        className="mt-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:underline cursor-pointer"
                      >
                        + Add item
                      </button>
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
        </section>
      ) : (
        /* High-Density List / Table View */
        <div className="overflow-x-auto rounded-2xl border border-[#EAE6DF] dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE6DF] dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 text-[#7A766F] dark:text-stone-400 text-[11px] font-mono uppercase tracking-wider">
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
                  <td
                    colSpan={6}
                    className="py-12 text-center text-xs text-stone-400 italic"
                  >
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

      {/* New / Edit Assignment Modal */}
      <AssignmentModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingAssignment(null);
        }}
        initialAssignment={editingAssignment}
        defaultStatus={createDefaultStatus}
        projects={projects}
        onSubmit={handleSaveAssignment}
      />

      {/* Grade Modal */}
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
