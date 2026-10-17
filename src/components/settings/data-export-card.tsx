'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  Table,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getFullAccountExport } from '@/lib/actions/export';
import {
  formatNoteAsMarkdown,
  formatTransactionsCsv,
  formatAssignmentsCsv,
  formatTasksCsv,
  formatHabitsCsv,
  createZipArchive,
} from '@/lib/export/formatters';

export function DataExportCard() {
  const [loadingType, setLoadingType] = useState<'notes' | 'csv' | 'json' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportNotes = async () => {
    try {
      setLoadingType('notes');
      setFeedback(null);

      const res = await getFullAccountExport();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch notes.');
      }

      const notes = res.data.notes;
      if (notes.length === 0) {
        setFeedback({ type: 'success', message: 'No notes found to export.' });
        return;
      }

      const files = notes.map((note) => {
        const cleanTitle = (note.title || 'Untitled')
          .replace(/[\\/:*?"<>|]/g, '-')
          .slice(0, 50)
          .trim();
        return {
          name: `${cleanTitle}.md`,
          content: formatNoteAsMarkdown(note),
        };
      });

      const zipBlob = createZipArchive(files);
      triggerDownload(zipBlob, `lifeos-obsidian-notes-${new Date().toISOString().slice(0, 10)}.zip`);
      setFeedback({ type: 'success', message: `Exported ${notes.length} Obsidian-ready Markdown notes.` });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error exporting notes.',
      });
    } finally {
      setLoadingType(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      setLoadingType('csv');
      setFeedback(null);

      const res = await getFullAccountExport();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch data.');
      }

      const files = [
        {
          name: 'transactions.csv',
          content: formatTransactionsCsv(res.data.transactions),
        },
        {
          name: 'assignments.csv',
          content: formatAssignmentsCsv(res.data.assignments),
        },
        {
          name: 'tasks.csv',
          content: formatTasksCsv(res.data.tasks),
        },
        {
          name: 'habits.csv',
          content: formatHabitsCsv(res.data.habits),
        },
      ];

      const zipBlob = createZipArchive(files);
      triggerDownload(zipBlob, `lifeos-tables-csv-${new Date().toISOString().slice(0, 10)}.zip`);
      setFeedback({
        type: 'success',
        message: `Exported transactions (${res.data.transactions.length}), assignments (${res.data.assignments.length}), and tasks (${res.data.tasks.length}) as RFC-4180 CSVs.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error exporting CSV tables.',
      });
    } finally {
      setLoadingType(null);
    }
  };

  const handleExportJson = async () => {
    try {
      setLoadingType('json');
      setFeedback(null);

      const res = await getFullAccountExport();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch account snapshot.');
      }

      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      triggerDownload(blob, `lifeos-account-snapshot-${new Date().toISOString().slice(0, 10)}.json`);
      setFeedback({ type: 'success', message: 'Full account JSON snapshot downloaded successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error downloading JSON snapshot.',
      });
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
        <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-outline" />
        </div>
        <div>
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Data Ownership & Export
          </h2>
          <p className="font-body-sm text-body-sm text-outline">
            Zero cloud lock-in. Download your personal workspace in open formats anytime.
          </p>
        </div>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-secondary/10 border-secondary/30 text-on-surface'
              : 'bg-red-500/10 border-red-500/30 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-body-sm text-body-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Three Export Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Notes (Obsidian) */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-on-surface">
              <FileText className="w-4 h-4 text-[#2f5c3a] dark:text-emerald-400" />
              <span className="font-body-sm text-body-sm font-semibold">Obsidian Markdown</span>
            </div>
            <p className="font-label-sm text-label-sm text-outline leading-relaxed">
              Notes formatted with clean YAML frontmatter, ready to drop into an Obsidian vault.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportNotes}
            disabled={loadingType !== null}
            className="w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-medium border border-outline-variant/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {loadingType === 'notes' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Notes (.md)</span>
          </button>
        </div>

        {/* Tables (CSV) */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-on-surface">
              <Table className="w-4 h-4 text-[#C2634C] dark:text-[#E07A63]" />
              <span className="font-body-sm text-body-sm font-semibold">Spreadsheets (CSV)</span>
            </div>
            <p className="font-label-sm text-label-sm text-outline leading-relaxed">
              RFC-4180 CSV tables for transactions, assignments, habits, and tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loadingType !== null}
            className="w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-medium border border-outline-variant/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {loadingType === 'csv' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Tables (.csv)</span>
          </button>
        </div>

        {/* Full JSON Snapshot */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-on-surface">
              <Database className="w-4 h-4 text-primary" />
              <span className="font-body-sm text-body-sm font-semibold">Account Snapshot</span>
            </div>
            <p className="font-label-sm text-label-sm text-outline leading-relaxed">
              Complete raw JSON archive of your entire workspace and relational schemas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={loadingType !== null}
            className="w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-medium border border-outline-variant/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {loadingType === 'json' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download Snapshot (.json)</span>
          </button>
        </div>
      </div>
    </section>
  );
}
