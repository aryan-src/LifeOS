'use client';

import React, { useTransition, useState } from 'react';
import Link from 'next/link';
import { promoteNoteToProject, type NoteWithProject } from '@/lib/actions/notes';
import { Rocket, Loader2, Check } from 'lucide-react';

interface BottomBandIdeasProps {
  initialNotes: NoteWithProject[];
}

export function BottomBandIdeas({ initialNotes }: BottomBandIdeasProps) {
  const [notes, setNotes] = useState<NoteWithProject[]>(initialNotes);
  const [promotedMap, setPromotedMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  const pinnedCount = notes.filter((n) => n.is_pinned).length;
  const displayNotes = notes.slice(0, 2);

  const handlePromote = (noteId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setLoadingMap((prev) => ({ ...prev, [noteId]: true }));

    startTransition(async () => {
      try {
        const res = await promoteNoteToProject(noteId);
        if (res.success) {
          setPromotedMap((prev) => ({ ...prev, [noteId]: true }));
          // Update note project association locally
          setNotes((prev) =>
            prev.map((n) =>
              n.id === noteId
                ? {
                    ...n,
                    project_id: res.data?.project_id || 'new-proj',
                    project: {
                      id: res.data?.project_id || 'new-proj',
                      title: n.title,
                      slug: res.data?.slug || 'project',
                    },
                  }
                : n
            )
          );
        }
      } catch (err) {
        console.error('Failed to promote note:', err);
      } finally {
        setLoadingMap((prev) => ({ ...prev, [noteId]: false }));
      }
    });
  };

  const formatDateShort = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    } catch {
      return 'RECENT';
    }
  };

  return (
    <div className="min-w-0 flex flex-col justify-between overflow-hidden border-t md:border-t-0 pt-3 md:pt-0">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[17px] xl:text-[18px] font-bold text-[#07343C] dark:text-zinc-100">
          Recent Ideas
        </h3>
        <Link
          href="/notes"
          className="text-[11px] font-medium text-[#07343C]/70 dark:text-zinc-400 hover:text-[#07343C] dark:hover:text-zinc-100 underline decoration-[#07343C]/30 dark:decoration-zinc-700"
        >
          ✎ New note
        </Link>
      </div>

      {/* Flat modern ivory paper cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-auto py-1">
        {displayNotes.length === 0 ? (
          <div className="col-span-2 text-[12px] text-[#07343C]/60 dark:text-zinc-400 py-3 text-center">
            No notes recorded in the vault.{' '}
            <Link href="/notes" className="text-[#0B5563] dark:text-emerald-400 underline">
              Write one
            </Link>
          </div>
        ) : (
          displayNotes.map((note) => {
            const isPromoted = promotedMap[note.id] || !!note.project_id;
            const isLoading = loadingMap[note.id];
            const tags = Array.isArray(note.tags) ? note.tags : [];
            const tagLabel = typeof tags[0] === 'string' ? tags[0] : (note.content && note.content.length > 40 ? 'draft' : 'note');

            return (
              <div
                key={note.id}
                className="p-2.5 xl:p-3 bg-[#FAF9F5] dark:bg-zinc-950/60 text-[#07343C] dark:text-zinc-100 rounded-xl border border-[#07343C]/10 dark:border-zinc-800 flex flex-col justify-between h-[96px] min-w-0 hover:border-[#10B981]/50 dark:hover:border-emerald-500/50 transition-colors shadow-2xs group relative"
              >
                <Link href="/notes" className="min-w-0">
                  <p className="text-[11px] font-medium leading-snug line-clamp-3 text-[#07343C]/90 dark:text-zinc-200">
                    <strong className="font-semibold">{note.title}</strong>
                    {note.content ? ` — ${note.content}` : ''}
                  </p>
                </Link>

                <div className="flex items-center justify-between text-[9px] text-[#07343C]/60 dark:text-zinc-400 font-semibold tracking-wider uppercase font-mono">
                  <span>{formatDateShort(note.updated_at)}</span>

                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.2 rounded bg-white dark:bg-zinc-800 border border-[#07343C]/10 dark:border-zinc-700 text-[8px] font-normal lowercase font-sans">
                      {tagLabel}
                    </span>

                    {/* 1-click "Promote to Project" Action Button */}
                    <button
                      type="button"
                      disabled={isPromoted || isLoading}
                      onClick={(e) => handlePromote(note.id, e)}
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                        isPromoted
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-white dark:bg-zinc-800 hover:bg-[#F3F0EA] dark:hover:bg-zinc-700 border border-[#07343C]/15 dark:border-zinc-700 text-[#07343C] dark:text-zinc-300 cursor-pointer shadow-2xs'
                      }`}
                      title={isPromoted ? 'Already Promoted' : 'Promote to Project (1-click)'}
                      aria-label="Promote Note to Project"
                    >
                      {isLoading ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : isPromoted ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          <span>Proj</span>
                        </>
                      ) : (
                        <>
                          <Rocket className="w-2.5 h-2.5 text-[#0B5563] dark:text-emerald-400" />
                          <span>+ Proj</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[11px] text-[#07343C]/60 dark:text-zinc-400 font-medium font-mono">
        {notes.length} notes · {pinnedCount} pinned
      </div>
    </div>
  );
}
