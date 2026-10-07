'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { NoteCard } from './note-card';
import { NoteCreateInput } from './note-create-input';
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

export function NotesGrid({ initialNotes }: NotesGridProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNoteForPromotion, setSelectedNoteForPromotion] = useState<NoteWithProject | null>(null);
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

  // Synchronize state when server updates initialNotes
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  // Load / persist Desk Jotter from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos_desk_jotter');
      if (saved) setDeskPadContent(saved);
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  const handleDeskPadChange = (val: string) => {
    setDeskPadContent(val);
    try {
      localStorage.setItem('lifeos_desk_jotter', val);
    } catch {
      // Ignore
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
      setErrorMessage(res.error || 'Failed to capture spark.');
    }
  };

  const handleAppendDeskPadToVault = async () => {
    if (!deskPadContent.trim()) return;

    const title = deskPadContent.trim().split('\n')[0].slice(0, 60) || 'Desk Jotter Capture';
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
        // Ignore
      }
    } else {
      setErrorMessage(res.error || 'Failed to save to vault.');
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
        `Successfully promoted to #${res.data.slug} (${res.data.tasks_created} tasks extracted).`
      );
      setTimeout(() => {
        setSelectedNoteForPromotion(null);
        setPromotionResult(null);
      }, 2000);
    } else {
      setErrorMessage(res.error || 'Promotion failed.');
    }
  };

  // Filter notes - memoized so keystrokes in desk jotter or quick capture do not recompute arrays
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

  // Analytics - memoized against notes array
  const totalSparks = useMemo(() => notes.length, [notes]);
  const promotedCount = useMemo(
    () => notes.filter((n) => n.project_id).length,
    [notes]
  );
  const conversionRate = useMemo(
    () => (totalSparks > 0 ? Math.round((promotedCount / totalSparks) * 100) : 0),
    [totalSparks, promotedCount]
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-space-md sm:px-space-lg lg:px-margin py-space-xl flex flex-col gap-space-xl">
      {/* Toast Alert */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-error-container bg-error-container p-4 text-on-error-container">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
            <span>LifeOS</span>
            <span className="text-outline-variant">/</span>
            <span>Workspace</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">Ideas & Notes</span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-1">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Ideas & Notes
            </h1>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
              {totalSparks} Active Sparks
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
            Freeform scratchpad, quick capture repository, and 1-click project promotion engine.
          </p>
        </div>

        {/* Action Cluster */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Tag Filter Pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleFilterChange(null)}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                filterTag === null
                  ? 'bg-surface-container-high text-on-surface font-medium'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              All
            </button>
            {['ai-research', 'engineering', 'design', 'academics'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleFilterChange(filterTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-colors ${
                  filterTag === tag
                    ? 'bg-surface-container-high text-on-surface font-medium'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Adaptive Spring Quick Capture Bar (Jahed AI-Input Design) */}
      <NoteCreateInput onSubmit={handleQuickSubmit} />

      {/* Main Workspace Split: Core Cards Feed & Persistent Desk Jotter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Primary Feed (Left 8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-xl">
          {/* Pinned / High-Sparks Shelf */}
          {pinnedNotes.length > 0 && (
            <section className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-outline">
                  <span className="material-symbols-outlined text-[14px]">push_pin</span>
                  <span>Pinned Sparks & High Impact</span>
                </div>
                <span className="font-label-sm text-label-sm text-outline">
                  {pinnedNotes.length} pinned
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
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

          {/* Fresh Scratchpad Stream */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-outline">
                <span className="material-symbols-outlined text-[14px]">stream</span>
                <span>Fresh Scratchpad Stream</span>
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                {unpinnedNotes.length} notes
              </span>
            </div>

            {unpinnedNotes.length === 0 && pinnedNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center bg-surface-container-low/30">
                <span className="material-symbols-outlined text-[36px] text-outline mb-2">
                  lightbulb
                </span>
                <p className="font-headline-sm text-headline-sm text-on-surface">No ideas captured yet.</p>
                <p className="font-body-sm text-body-sm text-outline mt-1">
                  Type a quick spark into the capture bar above or use Quick Capture (⌘K).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
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

        {/* Right Column: Desk Jotter & Vault Dynamics (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          {/* Interactive Scratchpad / Auto-Saving Desk Pad */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Desk Jotter
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                {deskPadContent.length} chars
              </span>
            </div>

            <div className="relative">
              <textarea
                value={deskPadContent}
                onChange={(e) => handleDeskPadChange(e.target.value)}
                rows={8}
                placeholder="Keep an untruncated fleeting stream here. Everything written auto-persists locally until you hit deposit or clear."
                className="w-full bg-surface-container-low rounded p-3 font-body-sm text-body-sm text-on-surface leading-relaxed resize-none focus:outline-none focus:bg-surface-container-lowest transition-colors border border-transparent focus:border-outline-variant/40"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDeskPadChange('')}
                  className="px-2.5 py-1 rounded hover:bg-surface-container text-outline hover:text-on-surface font-label-sm text-label-sm transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(deskPadContent);
                  }}
                  className="px-2.5 py-1 rounded hover:bg-surface-container text-outline hover:text-on-surface font-label-sm text-label-sm transition-colors"
                >
                  Copy
                </button>
              </div>

              <button
                type="button"
                onClick={handleAppendDeskPadToVault}
                disabled={!deskPadContent.trim()}
                className="px-3 py-1 rounded bg-primary text-on-primary font-body-sm text-body-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Append to Vault
              </button>
            </div>
          </div>

          {/* Vault Health & Metrics Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Vault Dynamics
              </span>
              <span className="material-symbols-outlined text-[18px] text-outline">analytics</span>
            </div>

            <div className="grid grid-cols-2 gap-space-sm">
              <div className="bg-surface-container-low p-space-sm rounded flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Total Sparks
                </span>
                <span className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">
                  {totalSparks}
                </span>
                <span className="font-label-sm text-label-sm text-secondary mt-0.5">
                  In Repository
                </span>
              </div>

              <div className="bg-surface-container-low p-space-sm rounded flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Promoted
                </span>
                <span className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">
                  {promotedCount}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                  {conversionRate}% conversion
                </span>
              </div>
            </div>

            {/* Distribution Visual */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant font-medium">Idea Distribution</span>
                <span className="text-outline">Top domains</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container flex overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '40%' }} title="AI & Research" />
                <div className="h-full bg-secondary" style={{ width: '30%' }} title="Engineering" />
                <div className="h-full bg-tertiary-container" style={{ width: '15%' }} title="Design" />
                <div className="h-full bg-outline" style={{ width: '15%' }} title="Academics" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relational "Promote to Project" Modal */}
      {selectedNoteForPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Promote Spark to Project
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNoteForPromotion(null)}
                className="rounded-lg p-1 text-outline hover:text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              This initiates an atomic transaction creating a new Project, generating its unique slug, and extracting any markdown checklist items as child tasks.
            </p>

            <form onSubmit={handleConfirmPromotion} className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm font-medium text-on-surface">Project Title</label>
                <input
                  name="title"
                  required
                  defaultValue={selectedNoteForPromotion.title}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm font-medium text-on-surface">Priority</label>
                  <select
                    name="priority"
                    defaultValue="2"
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-label-sm text-label-sm text-on-surface focus:outline-none"
                  >
                    <option value="4">P1 - Urgent</option>
                    <option value="3">P2 - High</option>
                    <option value="2">P3 - Medium</option>
                    <option value="1">P4 - Low</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm font-medium text-on-surface">Budget (₹)</label>
                  <input
                    name="budget"
                    type="number"
                    step="0.01"
                    defaultValue="0.00"
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              {promotionResult && (
                <div className="flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary-container p-2.5 font-label-sm text-label-sm text-on-secondary-fixed-variant">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{promotionResult}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setSelectedNoteForPromotion(null)}
                  className="rounded-lg px-3.5 py-1.5 font-body-sm text-body-sm text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPromoting}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 font-body-sm text-body-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  <span>{isPromoting ? 'Promoting...' : 'Confirm Promotion'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
