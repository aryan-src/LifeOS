import React from 'react';
import { getNotes } from '@/lib/actions/notes';
import { formatCalendarDate } from '@/lib/utils/date';
import Link from 'next/link';

export async function NotesQuadrant() {
  let notes: Awaited<ReturnType<typeof getNotes>> = [];
  try {
    const fetchedNotes = await getNotes();
    if (Array.isArray(fetchedNotes)) {
      notes = fetchedNotes;
    }
  } catch (error) {
    console.error('Failed to load notes for NotesQuadrant:', error);
  }
  const recentNotes = notes.slice(0, 3);

  return (
    <article className="p-6 md:p-8 flex flex-col justify-between gap-6 h-full min-w-0 relative z-10">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/20 dark:border-zinc-800/60 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-secondary dark:text-emerald-400 text-[20px] shrink-0">sticky_note_2</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-zinc-100 font-semibold truncate">Recent Ideas &amp; Scratchpad</h2>
          </div>
          <Link
            className="font-label-sm text-label-sm text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 flex items-center gap-1 transition-colors shrink-0"
            href="/notes"
          >
            <span>Open notes</span>
            <span className="material-symbols-outlined text-[14px] shrink-0">arrow_forward</span>
          </Link>
        </div>

        {/* Notes Stream */}
        <div className="flex flex-col gap-2.5">
          {recentNotes.length === 0 ? (
            <p className="text-body-sm text-outline dark:text-zinc-500 py-8 text-center font-normal">No ideas recorded in the vault yet.</p>
          ) : (
            recentNotes.map((note) => {
              const tags: string[] = Array.isArray(note.tags) ? (note.tags as string[]) : [];
              return (
                <Link
                  key={note.id}
                  href="/notes"
                  className="p-3 rounded-xl border border-outline-variant/20 dark:border-zinc-800/60 bg-surface-container-low/50 dark:bg-zinc-800/40 hover:bg-surface-container dark:hover:bg-zinc-800/70 transition-colors flex flex-col gap-1.5 group min-w-0"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="font-body-md text-body-md text-on-surface dark:text-zinc-100 group-hover:text-primary dark:group-hover:text-emerald-400 font-medium truncate">
                      {note.title}
                    </span>
                    <span suppressHydrationWarning className="font-label-sm text-label-sm text-outline dark:text-zinc-400 shrink-0 ml-2">
                      {formatCalendarDate(note.updated_at, 'short')}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-zinc-300 line-clamp-1">
                    {note.content || 'Empty note'}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                      {tags.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-surface-container-high dark:bg-zinc-800 text-on-surface-variant dark:text-zinc-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-3 flex items-center justify-between text-outline dark:text-zinc-400 font-label-sm text-label-sm border-t border-outline-variant/20 dark:border-zinc-800/60 mt-2">
        <span>{notes.length} total sparks</span>
        <Link
          href="/notes"
          className="text-on-surface-variant dark:text-zinc-300 hover:text-on-surface dark:hover:text-zinc-100 font-medium flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
          <span>New Scratch</span>
        </Link>
      </div>
    </article>
  );
}

export function NotesSkeleton() {
  return (
    <article className="p-6 md:p-8 animate-pulse h-full min-w-0 flex flex-col justify-between gap-6 relative z-10">
      <div className="h-5 w-36 bg-surface-container-high dark:bg-zinc-800 rounded-md" />
      <div className="space-y-3">
        <div className="h-14 bg-surface-container-low dark:bg-zinc-800/60 rounded-xl" />
        <div className="h-14 bg-surface-container-low dark:bg-zinc-800/60 rounded-xl" />
      </div>
      <div className="h-9 bg-surface-container-low dark:bg-zinc-800/60 rounded-xl" />
    </article>
  );
}
