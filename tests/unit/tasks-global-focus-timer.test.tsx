import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useFocusTimerStore } from '@/lib/store/use-focus-timer-store';
import {
  TasksFocusTimer,
  launchTasksFocusSession,
} from '@/components/tasks/tasks-focus-timer';
import { TaskChecklist } from '@/components/tasks/task-checklist';
import { DevBypassBanner } from '@/components/layout/dev-bypass-banner';

const mockUpdateTaskStatus = vi.fn();

vi.mock('@/lib/actions/tasks', () => ({
  updateTaskStatus: (...args: unknown[]) => mockUpdateTaskStatus(...args),
  deleteTask: vi.fn().mockResolvedValue({ success: true }),
  updateTaskPriority: vi.fn().mockResolvedValue({ success: true }),
  createTask: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/actions/focus-session', () => ({
  logFocusSession: vi.fn().mockResolvedValue({ success: true }),
  getFocusBindingContext: vi.fn().mockResolvedValue({ tasks: [], projects: [] }),
}));

function setNodeEnv(value: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

describe('Tasks Global Focus Timer Integration & No-Task Sessions', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    useFocusTimerStore.getState().resetForTests();
    mockUpdateTaskStatus.mockResolvedValue({
      success: true,
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        is_completed: false,
        in_progress: true,
      },
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('shows "No task selected" with zero fake tasks when no real tasks exist', () => {
    const html = renderToString(<TasksFocusTimer tasks={[]} boundTaskId={null} />);

    expect(html).toContain('data-purpose="tasks-global-focus-timer"');
    expect(html).toContain('No task selected');
    expect(html).toContain('Start Focus (25m)');
    expect(html).not.toContain('Q3 Product Architecture');
    expect(html).not.toContain('Zen Interface Polish');
    expect(html).not.toContain('Scandinavian Minimal Systems');
  });

  it('starts a global focus session cleanly when no task is selected and never calls updateTaskStatus', () => {
    const onTaskStatusChange = vi.fn();
    const { startFocus } = useFocusTimerStore.getState();

    launchTasksFocusSession({
      durationMinutes: 25,
      selectedTask: null,
      startFocus,
      onTaskStatusChange,
    });

    const timerState = useFocusTimerStore.getState().timer;
    expect(timerState.status).toBe('running');
    expect(timerState.plannedDurationSeconds).toBe(25 * 60);
    expect(timerState.taskId).toBeNull();
    expect(timerState.taskTitle).toBeNull();
    expect(timerState.isFullscreenOpen).toBe(true);

    expect(onTaskStatusChange).not.toHaveBeenCalled();
    expect(mockUpdateTaskStatus).not.toHaveBeenCalled();
  });

  it('sanitizes invalid non-UUID task IDs and never calls updateTaskStatus', () => {
    const onTaskStatusChange = vi.fn();
    const { startFocus } = useFocusTimerStore.getState();

    launchTasksFocusSession({
      durationMinutes: 25,
      selectedTask: { id: 't-1', title: 'Invalid Placeholder ID' },
      startFocus,
      onTaskStatusChange,
    });

    const timerState = useFocusTimerStore.getState().timer;
    expect(timerState.status).toBe('running');
    expect(timerState.taskId).toBeNull();
    expect(timerState.taskTitle).toBe('Invalid Placeholder ID');

    expect(onTaskStatusChange).not.toHaveBeenCalled();
    expect(mockUpdateTaskStatus).not.toHaveBeenCalled();
  });

  it('binds a valid UUID task and calls onTaskStatusChange when starting focus', () => {
    const validUuid = '22222222-2222-4222-8222-222222222222';
    const onTaskStatusChange = vi.fn();
    const { startFocus } = useFocusTimerStore.getState();

    launchTasksFocusSession({
      durationMinutes: 50,
      selectedTask: { id: validUuid, title: 'Write Daily Loop Architecture Notes' },
      startFocus,
      onTaskStatusChange,
    });

    const timerState = useFocusTimerStore.getState().timer;
    expect(timerState.status).toBe('running');
    expect(timerState.plannedDurationSeconds).toBe(50 * 60);
    expect(timerState.taskId).toBe(validUuid);
    expect(timerState.taskTitle).toBe('Write Daily Loop Architecture Notes');
    expect(onTaskStatusChange).toHaveBeenCalledWith(validUuid, true);
  });

  it('wires /tasks TaskChecklist to the Global Focus Timer (not legacy FocusTimer) and shares global store actions', () => {
    // 1. /tasks renders TasksFocusTimer wired to useFocusTimerStore (never legacy FocusTimer)
    const html = renderToString(
      <TaskChecklist
        initialTasks={[]}
        projects={[]}
        initialSelectedDate="2026-11-18"
      />
    );

    expect(html).toContain('data-purpose="tasks-global-focus-timer"');
    expect(html).toContain('No task selected');
    expect(html).toContain('Start Focus (25m)');
    expect(html).not.toContain('aria-label="Pomodoro Focus Timer"');
    expect(html).not.toContain('Q3 Product Architecture');
    expect(html).not.toContain('Invalid ID format');

    // 2. Starting via /tasks launchTasksFocusSession mutates the exact same global store used by Today card
    const store = useFocusTimerStore.getState();
    launchTasksFocusSession({
      durationMinutes: 90,
      selectedTask: null,
      startFocus: store.startFocus,
    });

    const running = useFocusTimerStore.getState().timer;
    expect(running.status).toBe('running');
    expect(running.mode).toBe('deep-work');
    expect(running.plannedDurationSeconds).toBe(90 * 60);
    expect(running.clientSessionId).toBeTruthy();

    // 3. Global store pause / resume / stopEarly operate seamlessly on the /tasks-started session
    useFocusTimerStore.getState().pauseFocus();
    expect(useFocusTimerStore.getState().timer.status).toBe('paused');

    useFocusTimerStore.getState().resumeFocus();
    expect(useFocusTimerStore.getState().timer.status).toBe('running');
  });

  it('renders DevBypassBanner only in development when DEV_BYPASS_AUTH=true and never in production', () => {
    setNodeEnv('development');
    process.env.DEV_BYPASS_AUTH = 'true';
    const devHtml = renderToString(<DevBypassBanner />);
    expect(devHtml).toContain('data-purpose="dev-bypass-banner"');
    expect(devHtml).toContain('DEV_BYPASS_AUTH=true');
    expect(devHtml).toContain('Supabase writes are disabled');

    setNodeEnv('production');
    process.env.DEV_BYPASS_AUTH = 'true';
    const prodHtml = renderToString(<DevBypassBanner />);
    expect(prodHtml).toBe('');

    setNodeEnv('development');
    delete process.env.DEV_BYPASS_AUTH;
    const disabledHtml = renderToString(<DevBypassBanner />);
    expect(disabledHtml).toBe('');
  });
});
