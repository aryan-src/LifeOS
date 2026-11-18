'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Lightbulb,
  Pin,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { NoteCard } from './note-card';
import { NoteCreateInput } from './note-create-input';
import { DeskJotter } from './desk-jotter';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
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

const TAG_FILTERS = ['ai-research', 'engineering', 'design', 'academics'] as const;

export function NotesGrid({ initialNotes }: NotesGridProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNoteForPromotion, setSelectedNoteForPromotion] =
    useState<NoteWithProject | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deskPadContent, setDeskPadContent] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleFilterChange = (tag: string | null) => {
    startTransition(() => {
      setFilterTag(tag);
    });
  };

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos_desk_jotter');
      if (saved) setDeskPadContent(saved);
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleDeskPadChange = (val: string) => {
    setDeskPadContent(val);
    try {
      localStorage.setItem('lifeos_desk_jotter', val);
    } catch {
      // ignore storage errors
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
    const res = await deleteNote(id);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to delete note.');
      setNotes(initialNotes);
    }
  };

  const handleQuickSubmit = async (content: string, tag: string) => {
    if (!content.trim()) return;

    const title = content.trim().split('\n')[0].slice(0, 80);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content.trim());
    formData.append('tags', tag);

    const res = await createNote(null, formData);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to capture note.');
    }
  };

  const [isAppendingDeskPad, setIsAppendingDeskPad] = useState(false);

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
        setErrorMessage(res.error || 'Failed to save to vault.');
      }
    } finally {
      setIsAppendingDeskPad(false);
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

  const filteredNotes = useMemo(() => {
    if (!filterTag) return notes;
    return notes.filter(
      (n) => Array.isArray(n.tags) && (n.tags as string[]).includes(filterTag)
    );
  }, [notes, filterTag]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.is_pinned),
    [filteredNotes]
  );

  const unpinnedNotes = useMemo(
    () => filteredNotes.filter((n) => !n.is_pinned),
    [filteredNotes]
  );

  const totalSparks = notes.length;
  const promotedCount = useMemo(() => notes.filter((n) => n.project_id).length, [notes]);
  const conversionRate =
    totalSparks > 0 ? Math.round((promotedCount / totalSparks) * 100) : 0;

  // Derived tag distribution from real notes (zero hardcoded percentages)
  const tagDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      const tags = Array.isArray(note.tags) && note.tags.length > 0 ? note.tags : ['untagged'];
      for (const t of tags) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = entries.reduce((acc, [, c]) => acc + c, 0);
    const toneClasses = ['bg-secondary', 'bg-on-tertiary-container', 'bg-primary', 'bg-outline'];
    return entries.map(([tag, count], idx) => ({
      tag,
      count,
      percent: sum > 0 ? Math.round((count / sum) * 100) : 0,
      colorClass: toneClasses[idx % toneClasses.length],
    }));
  }, [notes]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-error/30 bg-error-container p-4 text-on-error-container">
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

      {/* Stitch Notes Page Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-outline-variant/40 pb-5 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Pill tone="neutral" dot={true}>
              {totalSparks} {totalSparks === 1 ? 'note' : 'notes'}
            </Pill>
            {promotedCount > 0 && (
              <Pill tone="secondary">{promotedCount} promoted</Pill>
            )}
          </div>
          <h1 className="font-serif text-page-title font-normal tracking-tight text-on-surface">
            Notes
          </h1>
          <p className="max-w-2xl font-sans text-body-sm text-on-surface-variant">
            Freeform scratchpad, quick capture repository, and one-click project promotion.
          </p>
        </div>

        {/* Tag Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter notes by tag">
          <button
            type="button"
            onClick={() => handleFilterChange(null)}
            className={`rounded-full px-3 py-1 font-mono text-label-sm transition-colors cursor-pointer ${
              filterTag === null
                ? 'bg-primary text-on-primary font-medium'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            All
          </button>
          {TAG_FILTERS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleFilterChange(filterTag === tag ? null : tag)}
              className={`rounded-full px-3 py-1 font-mono text-label-sm transition-colors cursor-pointer ${
                filterTag === tag
                  ? 'bg-primary text-on-primary font-medium'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </header>

      {/* Quick Capture Input */}
      <NoteCreateInput onSubmit={handleQuickSubmit} />

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Notes Stream (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {pinnedNotes.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                  <Pin className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                  <span>Pinned Notes</span>
                </div>
                <span className="font-mono text-label-sm text-outline" style={LINING_NUMS_STYLE}>
                  {pinnedNotes.length} pinned
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDelete}
                    onPromoteClick={(n) => setSelectedNoteForPromotion(n)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                <Sparkles className="h-3.5 w-3.5 text-on-tertiary-container" aria-hidden="true" />
                <span>Scratchpad Stream</span>
              </div>
              <span className="font-mono text-label-sm text-outline" style={LINING_NUMS_STYLE}>
                {unpinnedNotes.length} {unpinnedNotes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>

            {unpinnedNotes.length === 0 && pinnedNotes.length === 0 ? (
              <EmptyState
                icon={<Lightbulb className="h-5 w-5" />}
                title="No ideas captured yet."
                description="Type a quick thought into the capture bar above or press ⌘K from anywhere."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDelete}
                    onPromoteClick={(n) => setSelectedNoteForPromotion(n)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: Persistent Desk Jotter & Vault Metrics (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <DeskJotter
            content={deskPadContent}
            onChange={handleDeskPadChange}
            onAppendToVault={handleAppendDeskPadToVault}
            isAppending={isAppendingDeskPad}
          />

          <Card padding="md" surface="lowest" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
                Vault Dynamics
              </h2>
              <BarChart3 className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-container-low p-3">
                <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Total Notes
                </span>
                <div
                  className="mt-1 font-mono text-stat-lg font-semibold text-on-surface"
                  style={LINING_NUMS_STYLE}
                >
                  {totalSparks}
                </div>
                <span className="font-mono text-[11px] text-secondary">In repository</span>
              </div>

              <div className="rounded-xl bg-surface-container-low p-3">
                <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Promoted
                </span>
                <div
                  className="mt-1 font-mono text-stat-lg font-semibold text-on-surface"
                  style={LINING_NUMS_STYLE}
                >
                  {promotedCount}
                </div>
                <span
                  className="font-mono text-[11px] text-on-surface-variant"
                  style={LINING_NUMS_STYLE}
                >
                  {conversionRate}% conversion
                </span>
              </div>
            </div>

            {tagDistribution.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between font-mono text-label-sm text-on-surface-variant">
                  <span>Tag distribution</span>
                  <span className="text-outline">Live breakdown</span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container">
                  {tagDistribution.map((entry) => (
                    <div
                      key={entry.tag}
                      className={`h-full ${entry.colorClass}`}
                      style={{ width: `${entry.percent}%` }}
                      title={`#${entry.tag}: ${entry.percent}%`}
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Promote Note to Project Modal (with shared focus trap & Esc dismissal) */}
      <Modal
        open={selectedNoteForPromotion !== null}
        onClose={() => setSelectedNoteForPromotion(null)}
        title="Promote Note to Project"
        description="Creates a new project with a unique slug and extracts checklist items as child tasks."
        maxWidth="lg"
      >
        {selectedNoteForPromotion && (
          <form onSubmit={handleConfirmPromotion} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="promote-project-title"
                className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant"
              >
                Project Title
              </label>
              <input
                id="promote-project-title"
                name="title"
                required
                defaultValue={selectedNoteForPromotion.title}
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3.5 py-2 font-sans text-body-sm text-on-surface focus:border-secondary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="promote-project-priority"
                  className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant"
                >
                  Priority
                </label>
                <select
                  id="promote-project-priority"
                  name="priority"
                  defaultValue="2"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2 font-mono text-label-sm text-on-surface focus:border-secondary focus:outline-none"
                >
                  <option value="4">P1 - Urgent</option>
                  <option value="3">P2 - High</option>
                  <option value="2">P3 - Medium</option>
                  <option value="1">P4 - Low</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="promote-project-budget"
                  className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant"
                >
                  Budget (₹)
                </label>
                <input
                  id="promote-project-budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  defaultValue="0.00"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2 font-mono text-label-sm text-on-surface focus:border-secondary focus:outline-none"
                />
              </div>
            </div>

            {promotionResult && (
              <div className="flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/12 p-3 font-mono text-label-sm text-secondary">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{promotionResult}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-outline-variant/30 pt-3">
              <button
                type="button"
                onClick={() => setSelectedNoteForPromotion(null)}
                className="rounded-xl border border-outline-variant/50 px-4 py-2 font-sans text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPromoting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 font-sans text-body-sm font-medium text-on-secondary transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
              >
                <Rocket className="h-4 w-4" aria-hidden="true" />
                <span>{isPromoting ? 'Promoting...' : 'Confirm Promotion'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
