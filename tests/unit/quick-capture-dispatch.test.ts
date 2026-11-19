import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dispatchQuickCapture,
  undoQuickCapture,
} from '@/lib/actions/quick-capture';

// Mock the server actions
vi.mock('@/lib/actions/tasks', () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('@/lib/actions/finances', () => ({
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  getCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/actions/notes', () => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
}));

vi.mock('@/lib/actions/assignments', () => ({
  createAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
}));

vi.mock('@/lib/actions/habits', () => ({
  toggleHabitLog: vi.fn(),
  getHabits: vi.fn().mockResolvedValue({ habits: [] }),
}));

vi.mock('@/lib/actions/projects-options', () => ({
  getProjectOptions: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/actions/profile', () => ({
  getProfile: vi.fn().mockResolvedValue({ timezone: 'Asia/Kolkata' }),
}));

import { createTask, deleteTask } from '@/lib/actions/tasks';
import { createTransaction, deleteTransaction } from '@/lib/actions/finances';
import { createNote, deleteNote } from '@/lib/actions/notes';
import { createAssignment, deleteAssignment } from '@/lib/actions/assignments';
import { toggleHabitLog } from '@/lib/actions/habits';

describe('Quick Capture Server Action Dispatch & 5-Second Undo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches task creation strictly via createTask and returns returned ID', async () => {
    vi.mocked(createTask).mockResolvedValueOnce({
      success: true,
      data: {
        id: 'task-uuid-123',
        title: 'Submit report',
        due_date: '2026-11-20',
        priority: 3,
        user_id: 'user-1',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_id: null,
        description: null,
        completed_at: null,
      },
    });

    const res = await dispatchQuickCapture('t Submit report !high tomorrow');
    expect(res.success).toBe(true);
    expect(res.data?.target).toBe('task');
    expect(res.data?.entityId).toBe('task-uuid-123');
    expect(createTask).toHaveBeenCalledTimes(1);

    // Verify Undo uses exact returned ID
    vi.mocked(deleteTask).mockResolvedValueOnce({ success: true });
    const undoRes = await undoQuickCapture('task', res.data!.entityId);
    expect(undoRes.success).toBe(true);
    expect(deleteTask).toHaveBeenCalledWith('task-uuid-123');
  });

  it('dispatches expense creation strictly via createTransaction with returned ID', async () => {
    vi.mocked(createTransaction).mockResolvedValueOnce({
      success: true,
      data: { id: 'tx-uuid-456' },
    });

    const res = await dispatchQuickCapture('₹450 cold brew coffee');
    expect(res.success).toBe(true);
    expect(res.data?.target).toBe('transaction');
    expect(res.data?.entityId).toBe('tx-uuid-456');
    expect(createTransaction).toHaveBeenCalledTimes(1);

    // Verify Undo uses exact returned ID
    vi.mocked(deleteTransaction).mockResolvedValueOnce({ success: true });
    const undoRes = await undoQuickCapture('transaction', res.data!.entityId);
    expect(undoRes.success).toBe(true);
    expect(deleteTransaction).toHaveBeenCalledWith('tx-uuid-456');
  });

  it('dispatches assignment creation strictly via createAssignment with returned ID', async () => {
    vi.mocked(createAssignment).mockResolvedValueOnce({
      success: true,
      data: {
        id: 'assign-uuid-789',
        title: 'Physics Lab 2',
        subject: 'physics',
        due_date: '2026-11-24',
        user_id: 'user-1',
        status: 'not_started',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_id: null,
        marks_achieved: null,
        total_marks: null,
      },
    });

    const res = await dispatchQuickCapture('a Physics Lab 2 #physics Nov 24');
    expect(res.success).toBe(true);
    expect(res.data?.target).toBe('assignment');
    expect(res.data?.entityId).toBe('assign-uuid-789');
    expect(createAssignment).toHaveBeenCalledTimes(1);

    // Verify Undo uses exact returned ID
    vi.mocked(deleteAssignment).mockResolvedValueOnce({ success: true });
    const undoRes = await undoQuickCapture('assignment', res.data!.entityId);
    expect(undoRes.success).toBe(true);
    expect(deleteAssignment).toHaveBeenCalledWith('assign-uuid-789');
  });

  it('dispatches idea fallback strictly via createNote with returned ID', async () => {
    vi.mocked(createNote).mockResolvedValueOnce({
      success: true,
      data: {
        id: 'note-uuid-999',
        title: 'Research transformer memory architecture',
        content: 'Research transformer memory architecture',
        tags: [],
        user_id: 'user-1',
        is_pinned: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_id: null,
      },
    });

    const res = await dispatchQuickCapture('Research transformer memory architecture');
    expect(res.success).toBe(true);
    expect(res.data?.target).toBe('note');
    expect(res.data?.entityId).toBe('note-uuid-999');
    expect(createNote).toHaveBeenCalledTimes(1);

    // Verify Undo uses exact returned ID
    vi.mocked(deleteNote).mockResolvedValueOnce({ success: true });
    const undoRes = await undoQuickCapture('note', res.data!.entityId);
    expect(undoRes.success).toBe(true);
    expect(deleteNote).toHaveBeenCalledWith('note-uuid-999');
  });

  it('checks in habit when uncompleted and allows undo', async () => {
    vi.mocked(toggleHabitLog).mockResolvedValueOnce({
      success: true,
      data: { habit_id: 'h-meditate', date: '2026-11-19', is_completed: true },
    });

    const context = {
      habits: [{ id: 'h-meditate', title: 'Meditate 10 mins', is_completed_today: false }],
    };

    const res = await dispatchQuickCapture('Meditate 10 mins', undefined, context);
    expect(res.success).toBe(true);
    expect(res.data?.target).toBe('habit');
    expect(res.data?.entityId).toBe('h-meditate');
    expect(toggleHabitLog).toHaveBeenCalledTimes(1);

    // Undo calls toggleHabitLog to un-check
    vi.mocked(toggleHabitLog).mockResolvedValueOnce({
      success: true,
      data: { habit_id: 'h-meditate', date: '2026-11-19', is_completed: false },
    });
    const undoRes = await undoQuickCapture('habit', res.data!.entityId, res.data?.extra);
    expect(undoRes.success).toBe(true);
    expect(toggleHabitLog).toHaveBeenCalledWith('h-meditate', res.data?.extra?.habitDate);
  });

  it('does NOT toggle if habit is already completed today and does not undo', async () => {
    const context = {
      habits: [{ id: 'h-read', title: 'Read 20 pages', is_completed_today: true }],
    };

    const res = await dispatchQuickCapture('Read 20 pages', undefined, context);
    expect(res.success).toBe(true);
    expect(res.data?.target).toBe('habit');
    expect(res.data?.message).toBe('Already done');
    expect(toggleHabitLog).not.toHaveBeenCalled();

    // Undo should do nothing because nothing changed
    const undoRes = await undoQuickCapture('habit', 'h-read', res.data?.extra);
    expect(undoRes.success).toBe(true);
    expect(undoRes.data?.undone).toBe(false);
    expect(toggleHabitLog).not.toHaveBeenCalled();
  });
});
