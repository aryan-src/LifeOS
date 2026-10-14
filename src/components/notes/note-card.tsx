'use client';

import React from 'react';
import type { NoteWithProject } from '@/lib/actions/notes';
import { formatDateIST } from '@/lib/utils/date';

interface NoteCardProps {
  note: NoteWithProject;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
  onPromoteClick: (note: NoteWithProject) => void;
}

export function NoteCard({
  note,
  onTogglePin,
  onDelete,
  onPromoteClick,
}: NoteCardProps) {
  const tags: string[] = Array.isArray(note.tags) ? (note.tags as string[]) : [];

  return (
    <article
      className={`bg-surface-container-lowest dark:bg-zinc-900/50 rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-md hover:shadow-md transition-all group border ${
        note.is_pinned
          ? 'border-secondary/40 ring-1 ring-secondary/20 dark:border-emerald-500/40 dark:ring-emerald-500/20'
          : 'border-outline-variant/30 hover:border-outline-variant/60 dark:border-zinc-800/60 dark:hover:border-zinc-700/60'
      }`}
    >
      <div className="flex flex-col gap-space-sm">
        {/* Top Header: Tags & Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {tags.length > 0 ? (
              tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-surface-container dark:bg-zinc-800 font-label-sm text-label-sm text-on-surface dark:text-zinc-200 font-medium truncate max-w-[120px]"
                >
                  #{tag}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded bg-surface-container-low dark:bg-zinc-800/50 font-label-sm text-label-sm text-outline dark:text-zinc-400">
                #spark
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={() => onTogglePin(note.id, !note.is_pinned)}
              className={`p-1 rounded transition-colors ${
                note.is_pinned
                  ? 'text-secondary dark:text-emerald-300 bg-secondary-container dark:bg-emerald-950/50'
                  : 'text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 hover:bg-surface-container dark:hover:bg-zinc-800'
              }`}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {note.is_pinned ? 'push_pin' : 'keep'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="p-1 rounded text-outline dark:text-zinc-400 hover:text-error dark:hover:text-rose-400 hover:bg-surface-container dark:hover:bg-zinc-800 transition-colors"
              title="Delete note"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>

        {/* Title & Content */}
        <div className="flex flex-col gap-1">
          <h3 className="font-headline-sm text-headline-sm text-on-surface dark:text-zinc-100 font-semibold tracking-tight group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
            {note.title}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-zinc-400 leading-relaxed whitespace-pre-line line-clamp-5">
            {note.content}
          </p>
        </div>
      </div>

      {/* Footer: Project link / Promote CTA + Date */}
      <div className="pt-space-xs flex items-center justify-between text-outline dark:text-zinc-400 border-t border-surface-container-high/60 dark:border-zinc-800/60 mt-1">
        {note.project ? (
          <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary dark:text-emerald-400 font-medium">
            <span className="material-symbols-outlined text-[13px]">folder</span>
            #{note.project.slug}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onPromoteClick(note)}
            className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface dark:text-zinc-300 font-medium hover:text-secondary dark:hover:text-emerald-400 transition-colors"
          >
            <span>Promote to Project</span>
            <span className="material-symbols-outlined text-[14px]">north_east</span>
          </button>
        )}

        <span suppressHydrationWarning className="font-label-sm text-label-sm text-outline dark:text-zinc-500">
          {formatDateIST(note.created_at, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </article>
  );
}
