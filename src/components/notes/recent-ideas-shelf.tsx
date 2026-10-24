'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { NoteWithProject } from '@/lib/actions/notes';

interface RecentIdeasShelfProps {
  initialNotes: NoteWithProject[];
  className?: string;
}

export function RecentIdeasShelf({
  initialNotes,
  className = '',
}: RecentIdeasShelfProps) {
  const [notes] = useState<NoteWithProject[]>(initialNotes);
  const displayNotes = notes.slice(0, 2);
  const pinnedCount = notes.filter((n) => n.is_pinned).length;

  const handleOpenQuickNote = () => {
    window.dispatchEvent(new CustomEvent('open-quick-capture'));
  };

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return 'OCT 15';
    try {
      const d = new Date(dateStr);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    } catch {
      return 'RECENT';
    }
  };

  return (
    <section
      className={`flex flex-col h-full overflow-hidden justify-between ${className}`}
      data-purpose="section-recent-ideas"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-stone-100 dark:border-zinc-800/60">
        <h2 className="text-base font-bold font-serif text-stone-900 dark:text-zinc-100 tracking-tight leading-none">
          Recent Ideas
        </h2>
        <button
          type="button"
          onClick={handleOpenQuickNote}
          className="text-[10px] font-medium text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200/80 dark:hover:bg-zinc-700 px-2 py-0.5 rounded border border-stone-200/60 dark:border-zinc-700/60 cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>New note</span>
        </button>
      </div>

      {/* Note cards */}
      <div className="flex-1 min-h-0 py-1 grid grid-cols-2 gap-2 overflow-y-auto no-scrollbar items-stretch">
        {displayNotes.length === 0 ? (
          <div className="col-span-2 text-center text-[11px] text-stone-400 dark:text-zinc-500 py-3">
            No notes recorded.{' '}
            <Link href="/notes" className="text-stone-700 dark:text-zinc-300 underline font-medium">
              Write one
            </Link>
          </div>
        ) : (
          displayNotes.map((note) => {
            const tags = Array.isArray(note.tags) ? note.tags : [];
            const tagLabel = typeof tags[0] === 'string' ? tags[0] : (note.content && note.content.length > 40 ? 'draft' : 'note');

            return (
              <Link
                key={note.id}
                href="/notes"
                className="p-2 rounded-xl border border-stone-200/70 dark:border-zinc-800 bg-[#FDFBF7] dark:bg-zinc-950/60 hover:border-stone-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <p className="text-[10.5px] text-stone-700 dark:text-zinc-300 leading-snug line-clamp-3">
                  <span className="font-semibold text-stone-900 dark:text-zinc-100">{note.title}</span>
                  {note.content ? ` — ${note.content.replace(/^[#\s*]+/, '')}` : ''}
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 dark:text-zinc-500 pt-1 border-t border-stone-200/50 dark:border-zinc-800 mt-1 shrink-0">
                  <span>{formatDateShort(note.created_at)}</span>
                  <span className="bg-stone-200/70 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 px-1 py-0.2 rounded uppercase text-[8px] font-medium">
                    {tagLabel}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto shrink-0 pt-1.5 border-t border-stone-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
        <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
          {notes.length} note{notes.length === 1 ? '' : 's'} · {pinnedCount} pinned
        </span>
        <Link
          className="hover:text-stone-700 dark:hover:text-zinc-300 font-sans transition-colors text-[11px] font-medium text-stone-500 dark:text-zinc-400"
          href="/notes"
        >
          Open scratchpad →
        </Link>
      </div>
    </section>
  );
}
