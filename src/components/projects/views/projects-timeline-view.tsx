'use client';

import React, { useState, useMemo } from 'react';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import type { ProjectStatus } from '@/types/database.types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../project-helpers';
import { formatNumber } from '@/lib/utils/format';
import { getTodayDate } from '@/lib/utils/date';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Inbox,
  Calendar,
} from 'lucide-react';

interface ProjectsTimelineViewProps {
  projects: ProjectWithMetrics[];
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onDelete: (projectId: string) => void;
  onEdit: (project: ProjectWithMetrics) => void;
  onNewProject: () => void;
}

interface QuarterInfo {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  label: string;
  startDate: Date;
  endDate: Date;
  months: { name: string; weeks: string[] }[];
}

function getQuarterInfo(year: number, quarter: 1 | 2 | 3 | 4): QuarterInfo {
  const qMonths: Record<1 | 2 | 3 | 4, { name: string; weeks: string[] }[]> = {
    1: [
      { name: 'JANUARY', weeks: ['W01', 'W02', 'W03', 'W04'] },
      { name: 'FEBRUARY', weeks: ['W05', 'W06', 'W07', 'W08'] },
      { name: 'MARCH', weeks: ['W09', 'W10', 'W11', 'W12'] },
    ],
    2: [
      { name: 'APRIL', weeks: ['W13', 'W14', 'W15', 'W16'] },
      { name: 'MAY', weeks: ['W17', 'W18', 'W19', 'W20'] },
      { name: 'JUNE', weeks: ['W21', 'W22', 'W23', 'W24'] },
    ],
    3: [
      { name: 'JULY', weeks: ['W25', 'W26', 'W27', 'W28'] },
      { name: 'AUGUST', weeks: ['W29', 'W30', 'W31', 'W32'] },
      { name: 'SEPTEMBER', weeks: ['W33', 'W34', 'W35', 'W36'] },
    ],
    4: [
      { name: 'OCTOBER', weeks: ['W40', 'W41', 'W42', 'W43'] },
      { name: 'NOVEMBER', weeks: ['W44', 'W45', 'W46', 'W47'] },
      { name: 'DECEMBER', weeks: ['W48', 'W49', 'W50', 'W51'] },
    ],
  };

  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59));

  const monthNames = ['Jan – Mar', 'Apr – Jun', 'Jul – Sep', 'Oct – Dec'];
  const label = `Q${quarter} ${year} (${monthNames[quarter - 1]})`;

  return {
    year,
    quarter,
    label,
    startDate,
    endDate,
    months: qMonths[quarter],
  };
}

export function ProjectsTimelineView({
  projects,
  onStatusChange,
  onDelete,
  onEdit,
  onNewProject,
}: ProjectsTimelineViewProps) {
  // Determine current quarter based on today
  const todayStr = getTodayDate();
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const currentQuarterNum = (Math.floor((tM - 1) / 3) + 1) as 1 | 2 | 3 | 4;

  const [selectedYear, setSelectedYear] = useState<number>(tY);
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(currentQuarterNum);
  const [granularity, setGranularity] = useState<'months' | 'weeks' | 'days'>('weeks');

  const quarterInfo = useMemo(
    () => getQuarterInfo(selectedYear, selectedQuarter),
    [selectedYear, selectedQuarter]
  );

  const handlePrevQuarter = () => {
    if (selectedQuarter === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedQuarter(4);
    } else {
      setSelectedQuarter((q) => (q - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleNextQuarter = () => {
    if (selectedQuarter === 4) {
      setSelectedYear((y) => y + 1);
      setSelectedQuarter(1);
    } else {
      setSelectedQuarter((q) => (q + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleToday = () => {
    setSelectedYear(tY);
    setSelectedQuarter(currentQuarterNum);
  };

  // Calculate Today position percentage if today falls in the selected quarter
  const qStartMs = quarterInfo.startDate.getTime();
  const qEndMs = quarterInfo.endDate.getTime();
  const qDuration = qEndMs - qStartMs;
  const todayMs = Date.UTC(tY, tM - 1, tD, 12, 0, 0);

  const isTodayInQuarter = todayMs >= qStartMs && todayMs <= qEndMs;
  const todayPct = isTodayInQuarter ? ((todayMs - qStartMs) / qDuration) * 100 : null;

  if (projects.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-400 dark:text-zinc-500 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">No projects found</h3>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-sm">
          No projects match your current filters. Initiate a new project to start scheduling roadmap milestones.
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
    <div className="flex flex-col space-y-4 w-full">
      {/* Granularity & Quarter Navigator Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Granularity Selector */}
        <div className="bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-0.5 rounded-xl flex items-center text-stone-600 dark:text-zinc-400 shadow-2xs">
          <button
            type="button"
            onClick={() => setGranularity('months')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              granularity === 'months'
                ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                : 'hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            Months
          </button>
          <button
            type="button"
            onClick={() => setGranularity('weeks')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              granularity === 'weeks'
                ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                : 'hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            Weeks
          </button>
          <button
            type="button"
            onClick={() => setGranularity('days')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              granularity === 'days'
                ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                : 'hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            Days
          </button>
        </div>

        {/* Quarter Navigator & Today button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 px-3 py-1.5 rounded-xl font-medium transition-colors shadow-2xs"
          >
            Today
          </button>

          <div className="bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 px-2 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevQuarter}
              className="p-1 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition"
              title="Previous quarter"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-semibold text-stone-900 dark:text-zinc-100 px-2">
              {quarterInfo.label}
            </span>
            <button
              type="button"
              onClick={handleNextQuarter}
              className="p-1 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition"
              title="Next quarter"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Timeline Canvas */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        {/* Timeline Header */}
        <div className="grid grid-cols-12 border-b border-stone-200/60 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-900/60 text-xs">
          {/* Sidebar Label Column */}
          <div className="col-span-4 lg:col-span-3 border-r border-stone-200/60 dark:border-zinc-800/80 p-3.5 flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase text-stone-600 dark:text-zinc-400 tracking-wider">
              Projects &amp; Deliverables
            </span>
            <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
              {projects.length} displayed
            </span>
          </div>

          {/* Timeline Chronological Grid Headers (3 Months) */}
          <div className="col-span-8 lg:col-span-9 grid grid-cols-3 divide-x divide-stone-200/60 dark:divide-zinc-800/80">
            {quarterInfo.months.map((m, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="py-2 px-3 font-semibold text-stone-800 dark:text-zinc-200 border-b border-stone-200/50 dark:border-zinc-800/60 bg-stone-50/90 dark:bg-zinc-900/90 text-center font-mono text-[11px] uppercase tracking-wider">
                  {m.name} {quarterInfo.year}
                </div>
                <div className="grid grid-cols-4 text-[10px] font-mono text-stone-400 dark:text-zinc-500 py-1 text-center bg-stone-50/30 dark:bg-zinc-900/40 divide-x divide-stone-200/30 dark:divide-zinc-800/40">
                  {m.weeks.map((w, wIdx) => (
                    <span key={wIdx}>{w}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Interactive Body */}
        <div className="divide-y divide-stone-100 dark:divide-zinc-800/60 relative">
          {/* "TODAY" Indicator Guideline */}
          {isTodayInQuarter && todayPct !== null && (
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
              style={{ left: `calc(25% + (75% * ${todayPct / 100}))` }}
            >
              <div className="bg-rose-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-semibold -mt-2 shadow-xs whitespace-nowrap">
                TODAY ({todayStr})
              </div>
              <div className="w-full h-full border-r border-dashed border-rose-400/80 dark:border-rose-500/80" />
            </div>
          )}

          {/* Project Rows */}
          {projects.map((project) => {
            const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG[2];
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
            const totalTasks = project.total_tasks || 0;
            const completedTasks = project.completed_tasks || 0;
            const completionPct =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : project.completion_percentage || 0;

            const budget = Number(project.budget) || 0;
            const spend = Number(project.total_spend) || 0;

            // Compute Gantt Bar Positioning
            // Project Start: from created_at
            let projStartMs = new Date(project.created_at).getTime();
            if (isNaN(projStartMs)) {
              projStartMs = qStartMs;
            }

            // Project End: from target_date, or fallback to start + 30 days
            let projEndMs: number;
            if (project.target_date) {
              const [dY, dM, dD] = project.target_date.split('-').map(Number);
              projEndMs = Date.UTC(dY, dM - 1, dD, 23, 59, 59);
            } else {
              projEndMs = projStartMs + 30 * 24 * 60 * 60 * 1000;
            }

            // Ensure projEndMs >= projStartMs
            if (projEndMs < projStartMs) {
              projEndMs = projStartMs + 7 * 24 * 60 * 60 * 1000;
            }

            // Compute Left and Width relative to the Quarter (0%..100%)
            let leftPct = ((projStartMs - qStartMs) / qDuration) * 100;
            let rightPct = ((projEndMs - qStartMs) / qDuration) * 100;

            // Clamping for visualization
            if (rightPct < 0) {
              // Ended before this quarter
              leftPct = 0;
              rightPct = 5;
            } else if (leftPct > 100) {
              // Starts after this quarter
              leftPct = 95;
              rightPct = 100;
            } else {
              leftPct = Math.max(0, Math.min(95, leftPct));
              rightPct = Math.max(leftPct + 8, Math.min(100, rightPct));
            }

            const widthPct = Math.max(8, rightPct - leftPct);

            return (
              <div
                key={project.id}
                className="grid grid-cols-12 min-h-[96px] group hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                {/* Item Card Metadata (Left Column) */}
                <div className="col-span-4 lg:col-span-3 border-r border-stone-200/60 dark:border-zinc-800/80 p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                      <button
                        type="button"
                        onClick={() => onEdit(project)}
                        className="text-xs font-semibold text-stone-900 dark:text-zinc-100 hover:underline text-left truncate"
                        title={project.title}
                      >
                        {project.title}
                      </button>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${priority.badgeClass}`}
                      >
                        {priority.shortLabel}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-stone-400 dark:text-zinc-500">
                    {project.slug ? (
                      <span className="bg-stone-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-zinc-400">
                        #{project.slug}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      {completionPct === 100 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {completionPct}% Done
                    </span>
                  </div>
                </div>

                {/* Gantt Bar Visualization (Right Column) */}
                <div className="col-span-8 lg:col-span-9 p-3 relative flex items-center overflow-visible">
                  {/* Background grid lines for weeks (12 cols) */}
                  <div className="absolute inset-0 grid grid-cols-12 divide-x divide-stone-100 dark:divide-zinc-800/40 pointer-events-none opacity-80">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} />
                    ))}
                  </div>

                  {/* Gantt Milestone Bar */}
                  <div
                    onClick={() => onEdit(project)}
                    className={`relative h-10 rounded-xl shadow-xs flex items-center justify-between px-3 z-10 cursor-pointer overflow-hidden transition-all group/bar ${
                      project.status === 'completed'
                        ? 'bg-emerald-600 dark:bg-emerald-700 text-white'
                        : project.status === 'paused'
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                        : project.status === 'backlog'
                        ? 'bg-stone-100 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                        : 'bg-white dark:bg-zinc-800/90 border-2 border-emerald-500 text-stone-900 dark:text-zinc-100'
                    }`}
                    style={{
                      marginLeft: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  >
                    {/* Internal Progress Fill */}
                    {project.status === 'active' && (
                      <div
                        className="absolute inset-y-0 left-0 bg-emerald-100/60 dark:bg-emerald-950/60 border-r border-emerald-400/40 pointer-events-none transition-all duration-300"
                        style={{ width: `${Math.min(completionPct, 100)}%` }}
                      />
                    )}

                    {/* Bar Label */}
                    <div className="relative flex items-center gap-1.5 z-10 truncate mr-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dotClass}`} />
                      <span className="text-xs font-semibold truncate">
                        {project.title}
                      </span>
                    </div>

                    {/* Completion Pill */}
                    <span
                      className={`relative z-10 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        project.status === 'completed'
                          ? 'bg-white/20 text-white'
                          : project.status === 'paused'
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                          : 'bg-stone-100 dark:bg-zinc-700 text-stone-800 dark:text-zinc-200'
                      }`}
                    >
                      {completionPct}%
                    </span>

                    {/* Interactive Hover Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:flex flex-col bg-stone-900 dark:bg-zinc-950 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap z-40 border border-stone-800 dark:border-zinc-800 pointer-events-none">
                      <span className="font-semibold">{project.title}</span>
                      <span className="text-stone-300 text-[10px] mt-0.5">
                        Target: {project.target_date || 'No deadline'} • {completedTasks}/{totalTasks} tasks
                      </span>
                      <span className="text-stone-400 text-[10px]">
                        Budget: ₹{formatNumber(spend)} / ₹{formatNumber(budget)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
