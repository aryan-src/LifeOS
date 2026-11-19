import React from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { FocusSessionRow } from '@/lib/actions/focus-session';
import { EmptyState } from '@/components/ui/empty-state';

interface RecentSessionsCardProps {
  sessions: FocusSessionRow[];
}

function formatSessionDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    if (isToday) return `Today · ${timeStr}`;
    if (isYesterday) return `Yesterday · ${timeStr}`;

    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month} · ${timeStr}`;
  } catch {
    return isoString.slice(0, 10);
  }
}

function formatSessionDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

function getModeBadge(mode: string): { label: string; className: string } {
  switch (mode?.toLowerCase()) {
    case 'pomodoro':
      return {
        label: 'Pomodoro',
        className: 'bg-on-tertiary-container/10 text-on-tertiary-container',
      };
    case 'break':
      return {
        label: 'Break',
        className: 'bg-surface-container text-on-surface-variant',
      };
    case 'deep':
    case 'deep_work':
    case 'deep work':
    default:
      return {
        label: 'Deep work',
        className: 'bg-secondary/10 text-secondary',
      };
  }
}

export function RecentSessionsCard({ sessions }: RecentSessionsCardProps) {
  return (
    <div
      className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-xs flex flex-col gap-5"
      data-purpose="recent-sessions-card"
    >
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
        <h2 className="text-xl font-normal font-serif text-on-surface">
          Recent Sessions
        </h2>
        <span className="font-mono text-label-sm text-on-surface-variant tabular-nums px-2.5 py-1 bg-surface-container rounded-lg">
          {`${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`}
        </span>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          compact={true}
          icon={<Clock className="h-5 w-5" />}
          title="No focus sessions recorded yet"
          description="Start a focus block from the timer HUD to begin logging deep work sessions."
          action={
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 font-sans text-body-sm font-medium text-on-secondary transition-opacity hover:opacity-95"
            >
              Start a focus session
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-mono text-label-sm uppercase tracking-wider">
                <th className="py-2.5 px-4 rounded-l-lg font-medium">Date & Time</th>
                <th className="py-2.5 px-4 font-medium">Mode</th>
                <th className="py-2.5 px-4 font-medium">Task / Project</th>
                <th className="py-2.5 px-4 rounded-r-lg font-medium text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="font-sans text-body-md text-on-surface divide-y divide-outline-variant/15">
              {sessions.map((session, index) => {
                const modeInfo = getModeBadge(session.mode);
                const taskTitle =
                  session.task?.title ||
                  session.project?.title ||
                  'Deep Focus Session';

                return (
                  <tr
                    key={session.id || `session-${index}`}
                    className="hover:bg-surface-container-low/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-label-sm tabular-nums text-on-surface-variant whitespace-nowrap">
                      {formatSessionDate(session.ended_at || session.started_at)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-label-sm font-medium ${modeInfo.className}`}
                      >
                        {modeInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-on-surface min-w-[180px] max-w-[280px] truncate">
                      {taskTitle}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-label-md tabular-nums font-semibold text-on-surface">
                      {formatSessionDuration(session.duration_seconds)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
