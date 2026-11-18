'use client';

import React from 'react';
import { ArrowUpRight, Folder, Pin, Trash2 } from 'lucide-react';
import type { NoteWithProject } from '@/lib/actions/notes';
import { formatDateIST } from '@/lib/utils/date';
import { Card } from '@/components/ui/card';

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
    <Card
      as="article"
      padding="md"
      surface="lowest"
      className={`group flex flex-col justify-between gap-4 transition-all ${
        note.is_pinned ? 'border-secondary/45 ring-1 ring-secondary/20' : ''
      }`}
    >
      <div className="flex flex-col gap-2.5">
        {/* Top Header: Tags & Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {tags.length > 0 ? (
              tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="max-w-[120px] truncate rounded-md bg-surface-container px-2 py-0.5 font-mono text-label-sm font-medium text-on-surface"
                >
                  #{tag}
                </span>
              ))
            ) : (
              <span className="rounded-md bg-surface-container-low px-2 py-0.5 font-mono text-label-sm text-outline">
                #note
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onTogglePin(note.id, !note.is_pinned)}
              aria-label={note.is_pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
                note.is_pinned
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-outline hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Pin className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(note.id)}
              aria-label={`Delete ${note.title}`}
              title="Delete note"
              className="rounded-lg p-1.5 text-outline transition-colors hover:bg-error-container/60 hover:text-error cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Title & Content */}
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
            {note.title}
          </h3>
          <p className="line-clamp-5 whitespace-pre-line font-sans text-body-sm leading-relaxed text-on-surface-variant">
            {note.content}
          </p>
        </div>
      </div>

      {/* Footer: Project link / Promote CTA + Date */}
      <div className="mt-1 flex items-center justify-between border-t border-outline-variant/30 pt-3">
        {note.project ? (
          <span className="inline-flex items-center gap-1 font-mono text-label-sm font-medium text-secondary">
            <Folder className="h-3.5 w-3.5" aria-hidden="true" />
            #{note.project.slug}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onPromoteClick(note)}
            className="inline-flex items-center gap-1 font-mono text-label-sm font-medium text-on-surface transition-colors hover:text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 rounded"
          >
            <span>Promote to Project</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}

        <span
          suppressHydrationWarning
          className="font-mono text-label-sm text-outline"
        >
          {formatDateIST(note.created_at, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </Card>
  );
}
