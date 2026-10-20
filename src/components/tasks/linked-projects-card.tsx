'use client';

import React from 'react';
import Link from 'next/link';
import { FolderGit2, ArrowRight } from 'lucide-react';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import type { CalendarProjectItem } from '@/components/ui/glass-calendar';

interface LinkedProjectsCardProps {
  projects?: (ProjectWithMetrics | CalendarProjectItem)[];
}

interface DisplayProject {
  id: string;
  tag: string;
  tagColor: string;
  progress: number;
  progressColor: string;
  title: string;
  subtitle: string;
}

const DEFAULT_TRACKS: DisplayProject[] = [
  {
    id: 'default-1',
    tag: 'Active Sprint',
    tagColor: 'text-emerald-700 dark:text-emerald-400',
    progress: 72,
    progressColor: 'bg-emerald-500 dark:bg-emerald-400',
    title: 'LifeOS Core Redesign',
    subtitle: 'Frontend Architecture',
  },
  {
    id: 'default-2',
    tag: 'Milestone 2',
    tagColor: 'text-sky-700 dark:text-sky-400',
    progress: 48,
    progressColor: 'bg-sky-500 dark:bg-sky-400',
    title: 'Frontend Performance',
    subtitle: 'Core Web Vitals & Cache',
  },
  {
    id: 'default-3',
    tag: 'Planning',
    tagColor: 'text-stone-500 dark:text-zinc-400',
    progress: 20,
    progressColor: 'bg-stone-500 dark:bg-zinc-400',
    title: 'API v2 Migration',
    subtitle: 'GraphQL & Batching',
  },
];

export function LinkedProjectsCard({ projects }: LinkedProjectsCardProps) {
  // Map incoming real projects if available, otherwise fallback to prototype defaults
  const displayTracks: DisplayProject[] = React.useMemo(() => {
    if (!projects || projects.length === 0) {
      return DEFAULT_TRACKS;
    }

    const mapped = projects.slice(0, 3).map((p, idx) => {
      const pWithMetrics = p as ProjectWithMetrics;
      const progress =
        typeof pWithMetrics.completion_percentage === 'number'
          ? pWithMetrics.completion_percentage
          : 0;

      const tagMap = ['Active Sprint', 'Milestone 2', 'Planning'];
      const colorMap = [
        {
          text: 'text-emerald-700 dark:text-emerald-400',
          bg: 'bg-emerald-500 dark:bg-emerald-400',
        },
        {
          text: 'text-sky-700 dark:text-sky-400',
          bg: 'bg-sky-500 dark:bg-sky-400',
        },
        {
          text: 'text-stone-500 dark:text-zinc-400',
          bg: 'bg-stone-500 dark:bg-zinc-400',
        },
      ];

      const color = colorMap[idx % colorMap.length];
      const tag =
        ('status' in p && p.status
          ? String(p.status).replace(/_/g, ' ')
          : tagMap[idx]) || 'Active';

      return {
        id: p.id || `proj-${idx}`,
        tag: tag.toUpperCase(),
        tagColor: color.text,
        progress,
        progressColor: color.bg,
        title: p.title,
        subtitle:
          ('description' in p && p.description) ||
          `${progress}% completed`,
      };
    });

    // Fill remaining up to 3 if fewer
    if (mapped.length < 3) {
      return [...mapped, ...DEFAULT_TRACKS.slice(mapped.length, 3)];
    }

    return mapped;
  }, [projects]);

  return (
    <div className="bg-white dark:bg-zinc-900/70 rounded-2xl p-5 border border-stone-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 font-semibold">
            Linked Project Tracks
          </h2>
        </div>
        <Link
          href="/projects"
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium font-sans group"
        >
          <span>View Roadmap</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 3-Column Project Track Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {displayTracks.map((track) => (
          <Link
            key={track.id}
            href="/projects"
            className="p-3 rounded-xl bg-stone-50/80 dark:bg-zinc-800/40 border border-stone-200/40 dark:border-zinc-800/60 flex flex-col justify-between gap-3 hover:bg-stone-100/70 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer group"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono text-[10px] uppercase font-semibold ${track.tagColor}`}
                >
                  {track.tag}
                </span>
                <span className="font-mono text-[11px] text-stone-400 dark:text-zinc-500">
                  {track.progress}%
                </span>
              </div>
              <span className="text-[13px] text-stone-900 dark:text-zinc-100 font-semibold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {track.title}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                {track.subtitle}
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-200/80 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${track.progressColor} rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(Math.max(track.progress, 0), 100)}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
