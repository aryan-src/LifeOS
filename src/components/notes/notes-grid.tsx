'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Folder,
  Layers,
  PenSquare,
  Pin,
  Plus,
  Rocket,
  Search,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { DeskJotter } from './desk-jotter';
import {
  togglePinNote,
  deleteNote,
  promoteNoteToProject,
  createNote,
  type NoteWithProject,
} from '@/lib/actions/notes';

interface NotesGridProps {
  initialNotes: NoteWithProject[];
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function formatNoteDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      const hours = d.getHours() % 12 || 12;
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
      return `Today ${hours}:${mins} ${ampm}`;
    }
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
  } catch {
    return isoString.slice(0, 10);
  }
}

export function NotesGrid({ initialNotes }: NotesGridProps) {
  const [notes, setNotes] = useState<NoteWithProject[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialNotes.length > 0 ? initialNotes[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJotter, setShowJotter] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Desk pad state
  const [deskPadContent, setDeskPadContent] = useState('');
  const [isAppendingDeskPad, setIsAppendingDeskPad] = useState(false);

  // Promotion state
  const [selectedNoteForPromotion, setSelectedNoteForPromotion] =
    useState<NoteWithProject | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  useEffect(() => {
    setNotes(initialNotes);
    if (initialNotes.length > 0) {
      setSelectedNoteId((prev) =>
        prev && initialNotes.some((n) => n.id === prev) ? prev : initialNotes[0].id
      );
    } else {
      setSelectedNoteId(null);
    }
  }, [initialNotes]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos_desk_jotter');
      if (saved) setDeskPadContent(saved);
    } catch {
      // ignore
    }
  }, []);

  const handleDeskPadChange = (val: string) => {
    setDeskPadContent(val);
    try {
      localStorage.setItem('lifeos_desk_jotter', val);
    } catch {
      // ignore
    }
  };

  const handleAppendDeskPadToVault = async () => {
    if (!deskPadContent.trim() || isAppendingDeskPad) return;
    setIsAppendingDeskPad(true);
    try {
      const title =
        deskPadContent.trim().split('\n')[0].slice(0, 60) || 'Desk Jotter Capture';
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', deskPadContent.trim());
      formData.append('tags', 'scratchpad');

      const res = await createNote(null, formData);
      if (res.success) {
        setDeskPadContent('');
        try {
          localStorage.removeItem('lifeos_desk_jotter');
        } catch {
          // ignore
        }
      } else {
        setErrorMessage(res.error || 'Failed to save note.');
      }
    } finally {
      setIsAppendingDeskPad(false);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_pinned: isPinned } : n))
    );
    const res = await togglePinNote(id, isPinned);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update note pin.');
      setNotes(initialNotes);
    }
  };

  const handleDelete = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
      setIsMobileDetailOpen(false);
    }
    const res = await deleteNote(id);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to delete note.');
      setNotes(initialNotes);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string)?.trim();
    const content = (formData.get('content') as string)?.trim();
    const tags = (formData.get('tags') as string)?.trim() || 'general';

    if (!title && !content) {
      setIsCreating(false);
      return;
    }

    const res = await createNote(null, formData);
    setIsCreating(false);
    if (res.success) {
      setShowCreateModal(false);
    } else {
      setErrorMessage(res.error || 'Failed to capture note.');
    }
  };

  const handleConfirmPromotion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedNoteForPromotion) return;

    setIsPromoting(true);
    setErrorMessage(null);
    setPromotionResult(null);

    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string) || selectedNoteForPromotion.title;
    const priority = parseInt((formData.get('priority') as string) || '2', 10);
    const budget = parseFloat((formData.get('budget') as string) || '0');

    const res = await promoteNoteToProject(selectedNoteForPromotion.id, {
      title,
      priority,
      budget: isNaN(budget) ? 0 : budget,
    });

    setIsPromoting(false);
    if (res.success && res.data) {
      setPromotionResult(
        `Promoted to #${res.data.slug} (${res.data.tasks_created} tasks extracted).`
      );
      setTimeout(() => {
        setSelectedNoteForPromotion(null);
        setPromotionResult(null);
      }, 2000);
    } else {
      setErrorMessage(res.error || 'Promotion failed.');
    }
  };

  // Derive unique tags with real counts
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      const rawTags = Array.isArray(note.tags) ? note.tags : [];
      const tags = rawTags.filter(
        (t): t is string => typeof t === 'string' && t.trim().length > 0
      );
      for (const t of tags) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Derived tag distribution percentages
  const tagDistribution = useMemo(() => {
    const sum = tagCounts.reduce((acc, [, c]) => acc + c, 0);
    const toneClasses = ['bg-secondary', 'bg-on-tertiary-container', 'bg-primary', 'bg-outline'];
    return tagCounts.slice(0, 4).map(([tag, count], idx) => ({
      tag,
      count,
      percent: sum > 0 ? Math.round((count / sum) * 100) : 0,
      colorClass: toneClasses[idx % toneClasses.length],
    }));
  }, [tagCounts]);

  // Filter notes by search query and selected tag
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (filterTag) {
      result = result.filter(
        (n) => Array.isArray(n.tags) && (n.tags as string[]).includes(filterTag)
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (Array.isArray(n.tags) &&
            (n.tags as string[]).some((t) => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [notes, filterTag, searchQuery]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.is_pinned),
    [filteredNotes]
  );

  const streamNotes = useMemo(
    () => filteredNotes.filter((n) => !n.is_pinned),
    [filteredNotes]
  );

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const totalCount = notes.length;
  const pinnedCount = useMemo(() => notes.filter((n) => n.is_pinned).length, [notes]);
  const streamCount = totalCount - pinnedCount;

  return (
    <div
      className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32"
      data-purpose="notes-two-pane-view"
    >
      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-error/30 bg-error-container p-4 text-on-error-container">
          <div className="flex items-center gap-2 font-sans text-body-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="font-mono text-label-sm font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
        <h1 className="font-serif text-page-title font-normal tracking-tight text-on-surface">
          Notes
        </h1>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowJotter((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/40 transition-colors font-sans text-body-sm shadow-xs cursor-pointer ${
              showJotter
                ? 'bg-surface-container-high text-on-surface'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <PenSquare className="h-4 w-4" aria-hidden="true" />
            <span>{showJotter ? 'Hide quick notes' : 'Quick notes'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 transition-all font-sans text-body-sm font-medium shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New note</span>
          </button>
        </div>
      </div>

      {/* Desk Jotter Scratchpad Drawer */}
      {showJotter && (
        <div className="my-6">
          <DeskJotter
            content={deskPadContent}
            onChange={handleDeskPadChange}
            onAppendToVault={handleAppendDeskPadToVault}
            isAppending={isAppendingDeskPad}
          />
        </div>
      )}

      {/* Search and Tag Chips Bar */}
      <div className="flex flex-col gap-4 my-6">
        <div className="relative w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant h-4 w-4"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search note content, titles, or tags..."
            className="w-full pl-10 pr-16 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl font-sans text-body-sm text-on-surface placeholder:text-on-surface-variant shadow-xs focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="font-mono text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
              ⌘
            </kbd>
            <kbd className="font-mono text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
              /
            </kbd>
          </div>
        </div>

        {/* Tag Filter Pills */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
          role="group"
          aria-label="Filter notes by tag"
        >
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                setFilterTag(null);
              });
            }}
            className={`px-3 py-1 rounded-full font-mono text-label-sm font-medium whitespace-nowrap shadow-xs cursor-pointer transition-colors ${
              filterTag === null
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Notes ({totalCount})
          </button>

          {tagCounts.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                startTransition(() => {
                  setFilterTag(filterTag === tag ? null : tag);
                });
              }}
              className={`px-3 py-1 rounded-full font-mono text-label-sm whitespace-nowrap transition-colors cursor-pointer ${
                filterTag === tag
                  ? 'bg-secondary text-on-secondary font-medium'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              #{tag} ({count})
            </button>
          ))}
        </div>

        {/* Derived Tag Distribution Telemetry Strip (when notes exist) */}
        {tagDistribution.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-label-sm text-on-surface-variant">
            <span className="uppercase tracking-wider text-[11px] font-medium text-outline">
              Topics:
            </span>
            {tagDistribution.map((item) => (
              <span
                key={`dist-${item.tag}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-container-low border border-outline-variant/30 tabular-nums"
              >
                <span className={`w-2 h-2 rounded-full ${item.colorClass}`} aria-hidden="true" />
                <span>{`#${item.tag}: ${item.percent}%`}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Two-Pane Master-Detail Split */}
      {totalCount === 0 ? (
        <Card surface="lowest" padding="lg">
          <EmptyState
            icon={<StickyNote className="h-6 w-6" />}
            title="No ideas captured yet."
            description="Use the + New note button or Quick notes above to write down thoughts and ideas."
            action={
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 transition-all font-sans text-body-sm font-medium shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>+ New note</span>
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane (5 cols on xl / 4 cols on lg): Note Card Stream */}
          <div
            className={`lg:col-span-4 xl:col-span-5 flex flex-col gap-3 ${
              isMobileDetailOpen ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">
                Sorted by Modified
              </span>
              <span className="font-mono text-label-sm text-on-surface-variant" style={LINING_NUMS_STYLE}>
                {pinnedCount} pinned / {streamCount} stream
              </span>
            </div>

            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 px-1 font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                  <Pin className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                  <span>Pinned Notes</span>
                </div>
                {pinnedNotes.map((note) => {
                  const isSelected = selectedNoteId === note.id;
                  const wordCount = countWords(note.content);
                  const firstTag =
                    Array.isArray(note.tags) && note.tags[0]
                      ? String(note.tags[0])
                      : 'general';

                  return (
                    <article
                      key={note.id}
                      onClick={() => {
                        setSelectedNoteId(note.id);
                        setIsMobileDetailOpen(true);
                      }}
                      className={`p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden border ${
                        isSelected
                          ? 'bg-surface-container-lowest border-secondary shadow-sm ring-2 ring-secondary'
                          : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60 shadow-xs'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
                      )}
                      <div className="flex items-start justify-between gap-2 mb-1.5 pl-1">
                        <h2 className="font-sans text-headline-sm font-semibold text-on-surface line-clamp-1">
                          {note.title}
                        </h2>
                        <Pin
                          className="h-4 w-4 text-secondary shrink-0 fill-secondary"
                          aria-label="Pinned note"
                        />
                      </div>
                      <p className="font-sans text-body-sm text-on-surface-variant line-clamp-2 mb-3 pl-1 leading-relaxed">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between pt-2 pl-1 bg-surface-container-low/50 rounded-lg px-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-label-sm text-on-secondary-container bg-secondary/15 px-2 py-0.5 rounded font-medium">
                            #{firstTag}
                          </span>
                          <span className="font-mono text-label-sm text-on-surface-variant">
                            {formatNoteDate(note.updated_at || note.created_at)}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Stream Section */}
            <div className="flex flex-col gap-2.5">
              {streamNotes.map((note) => {
                const isSelected = selectedNoteId === note.id;
                const firstTag =
                  Array.isArray(note.tags) && note.tags[0]
                    ? String(note.tags[0])
                    : 'general';

                return (
                  <article
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsMobileDetailOpen(true);
                    }}
                    className={`p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden border ${
                      isSelected
                        ? 'bg-surface-container-lowest border-secondary shadow-sm ring-2 ring-secondary'
                        : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60 shadow-xs group'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1.5 pl-1">
                      <h2 className="font-sans text-headline-sm font-semibold text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                        {note.title}
                      </h2>
                      <ChevronRight className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <p className="font-sans text-body-sm text-on-surface-variant line-clamp-2 mb-3 pl-1 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between pt-1 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-label-sm text-on-tertiary-container bg-surface-container px-2 py-0.5 rounded font-medium">
                          #{firstTag}
                        </span>
                        <span className="font-mono text-label-sm text-on-surface-variant">
                          {formatNoteDate(note.updated_at || note.created_at)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredNotes.length === 0 && (
              <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <p className="font-sans text-body-sm text-on-surface-variant">
                  No notes match your filter or search query.
                </p>
              </div>
            )}
          </div>

          {/* Right Pane (7 cols on xl / 8 cols on lg): Active Note Reader / Inspector */}
          <div
            className={`lg:col-span-8 xl:col-span-7 flex flex-col ${
              !isMobileDetailOpen ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {selectedNote ? (
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 lg:p-10 border border-outline-variant/30 shadow-xs flex flex-col gap-6">
                {/* Top Action Bar */}
                <div className="flex items-center justify-between pb-3 bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    {/* Mobile Back Button */}
                    <button
                      type="button"
                      onClick={() => setIsMobileDetailOpen(false)}
                      className="lg:hidden inline-flex items-center gap-1 font-mono text-label-sm text-on-surface-variant hover:text-on-surface cursor-pointer pr-2 border-r border-outline-variant/40"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Back</span>
                    </button>

                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-mono text-label-sm text-on-surface-variant truncate">
                      <span>Notes</span>
                      <span className="text-on-surface-variant/40">/</span>
                      <span className="text-on-surface font-medium truncate max-w-[180px]">
                        {selectedNote.title}
                      </span>
                    </nav>
                  </div>

                  {/* Note Action Buttons */}
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(selectedNote.id, !selectedNote.is_pinned)}
                      title={selectedNote.is_pinned ? 'Unpin note' : 'Pin note'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        selectedNote.is_pinned
                          ? 'bg-secondary/15 text-secondary'
                          : 'hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <Pin className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedNoteForPromotion(selectedNote)}
                      title="Promote to Project"
                      className="p-1.5 rounded-lg hover:bg-surface-container hover:text-secondary transition-colors cursor-pointer"
                    >
                      <Rocket className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(selectedNote.id)}
                      title="Delete note"
                      className="p-1.5 rounded-lg hover:bg-error-container hover:text-error transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Note Header */}
                <header className="flex flex-col gap-3">
                  <h1 className="font-sans text-headline-lg font-semibold text-on-surface tracking-tight leading-snug">
                    {selectedNote.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-on-surface-variant font-mono text-label-sm">
                    <span>{formatNoteDate(selectedNote.updated_at || selectedNote.created_at)}</span>
                    <div className="flex items-center gap-1.5">
                      {Array.isArray(selectedNote.tags) &&
                        selectedNote.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-medium"
                          >
                            #{String(t)}
                          </span>
                        ))}
                    </div>
                  </div>
                </header>

                {/* Note Content */}
                <div className="space-y-4 text-on-surface font-sans text-body-md leading-relaxed whitespace-pre-wrap">
                  {selectedNote.content}
                </div>

                {/* Linked Project Banner or Promotion Callout */}
                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {selectedNote.project ? (
                    <div className="flex items-center gap-2 font-mono text-label-sm text-secondary">
                      <Folder className="h-4 w-4" aria-hidden="true" />
                      <span>Linked Project: #{selectedNote.project.slug}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
                      <div className="space-y-0.5">
                        <div className="font-sans text-body-sm font-medium text-on-surface">
                          Ready to start on this note?
                        </div>
                        <div className="font-sans text-body-sm text-on-surface-variant">
                          Promote this idea directly to an active Project with auto-extracted tasks.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedNoteForPromotion(selectedNote)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-sans text-body-sm font-medium hover:bg-secondary/90 transition-all cursor-pointer shadow-xs shrink-0"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Promote</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-12 border border-outline-variant/30 shadow-xs flex flex-col items-center justify-center text-center gap-3">
                <StickyNote className="h-8 w-8 text-on-surface-variant" aria-hidden="true" />
                <h3 className="font-sans text-headline-sm font-semibold text-on-surface">
                  No note selected
                </h3>
                <p className="font-sans text-body-sm text-on-surface-variant max-w-sm">
                  Select a note from the left stream to inspect its contents, or create a new note.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Note Modal */}
      {showCreateModal && (
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Note"
          description="Capture a new idea, reference, or academic insight."
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new-note-title"
                className="block font-mono text-label-sm font-medium text-on-surface mb-1"
              >
                Title
              </label>
              <input
                id="new-note-title"
                name="title"
                type="text"
                required
                placeholder="e.g. Systems Architecture Review"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-sans text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div>
              <label
                htmlFor="new-note-content"
                className="block font-mono text-label-sm font-medium text-on-surface mb-1"
              >
                Content
              </label>
              <textarea
                id="new-note-content"
                name="content"
                rows={5}
                required
                placeholder="Write your note in plain text or markdown..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-sans text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div>
              <label
                htmlFor="new-note-tags"
                className="block font-mono text-label-sm font-medium text-on-surface mb-1"
              >
                Tags (comma separated)
              </label>
              <input
                id="new-note-tags"
                name="tags"
                type="text"
                placeholder="academics, engineering, ideas"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-sans text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant font-sans text-body-sm hover:text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 rounded-xl bg-secondary text-on-secondary font-sans text-body-sm font-medium hover:bg-secondary/90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isCreating ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Promotion Modal */}
      {selectedNoteForPromotion && (
        <Modal
          open={Boolean(selectedNoteForPromotion)}
          onClose={() => {
            setSelectedNoteForPromotion(null);
            setPromotionResult(null);
          }}
          title="Promote Note to Project"
          description={`Convert "${selectedNoteForPromotion.title}" into an active tracked project.`}
        >
          {promotionResult ? (
            <div className="py-4 text-center space-y-2">
              <div className="font-sans text-body-md font-medium text-secondary">
                {promotionResult}
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmPromotion} className="space-y-4">
              <div>
                <label
                  htmlFor="promo-title"
                  className="block font-mono text-label-sm font-medium text-on-surface mb-1"
                >
                  Project Title
                </label>
                <input
                  id="promo-title"
                  name="title"
                  type="text"
                  defaultValue={selectedNoteForPromotion.title}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-sans text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="promo-priority"
                    className="block font-mono text-label-sm font-medium text-on-surface mb-1"
                  >
                    Priority
                  </label>
                  <select
                    id="promo-priority"
                    name="priority"
                    defaultValue="2"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-sans text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    <option value="1">High Priority (1)</option>
                    <option value="2">Medium Priority (2)</option>
                    <option value="3">Low Priority (3)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="promo-budget"
                    className="block font-mono text-label-sm font-medium text-on-surface mb-1"
                  >
                    Budget (₹)
                  </label>
                  <input
                    id="promo-budget"
                    name="budget"
                    type="number"
                    defaultValue="0"
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-sans text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setSelectedNoteForPromotion(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant font-sans text-body-sm hover:text-on-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPromoting}
                  className="px-4 py-2 rounded-xl bg-secondary text-on-secondary font-sans text-body-sm font-medium hover:bg-secondary/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPromoting ? 'Promoting...' : 'Confirm Project'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
