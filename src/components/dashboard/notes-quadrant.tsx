import React from 'react';
import { getNotes } from '@/lib/actions/notes';
import Link from 'next/link';

export async function NotesQuadrant() {
  const notes = await getNotes();
  const recentNotes = notes.slice(0, 3);

  return (
    <article className="rounded bg-surface-container-lowest shadow-sm p-space-lg flex flex-col justify-between gap-space-md h-full">
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">sticky_note_2</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">Recent Ideas &amp; Scratchpad</h2>
          </div>
          <Link
            className="font-label-sm text-label-sm text-outline hover:text-on-surface flex items-center gap-0.5 transition-colors"
            href="/notes"
          >
            <span>Open notes</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        {/* Notes Stream */}
        <div className="flex flex-col gap-2.5">
          {recentNotes.length === 0 ? (
            <p className="text-body-sm text-outline py-6 text-center">No ideas recorded in the vault yet.</p>
          ) : (
            recentNotes.map((note) => {
              const tags: string[] = Array.isArray(note.tags) ? (note.tags as string[]) : [];
              return (
                <Link
                  key={note.id}
                  href="/notes"
                  className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface group-hover:text-primary font-medium truncate">
                      {note.title}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline shrink-0 ml-2">
                      {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                    {note.content || 'Empty note'}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {tags.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
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

      <div className="pt-space-xs flex items-center justify-between text-outline font-label-sm text-label-sm border-t border-surface-container-high/60 mt-2">
        <span>{notes.length} total sparks</span>
        <Link
          href="/notes"
          className="text-on-surface-variant hover:text-on-surface font-medium flex items-center gap-1"
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
    <div className="rounded bg-surface-container-lowest p-space-lg shadow-sm animate-pulse h-80 flex flex-col justify-between">
      <div className="h-5 w-32 bg-surface-container-high rounded" />
      <div className="space-y-2.5">
        <div className="h-14 bg-surface-container-low rounded" />
        <div className="h-14 bg-surface-container-low rounded" />
      </div>
      <div className="h-8 bg-surface-container-low rounded" />
    </div>
  );
}
