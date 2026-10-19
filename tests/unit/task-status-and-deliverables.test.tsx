import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TaskItem } from '@/components/tasks/task-item';
import { TaskChecklist } from '@/components/tasks/task-checklist';
import { updateTaskStatusSchema } from '@/lib/validations';
import type { TaskWithProject } from '@/lib/actions/tasks';

describe('Interactive Task Status & Deliverables Segregation', () => {
  const mockTasks: TaskWithProject[] = [
    {
      id: 'd9b2d62d-0b1a-4d76-92e1-456789abcdef',
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      project_id: 'p-1',
      title: 'Complete Java',
      description: 'Core syntax and OOP exercises',
      is_completed: false,
      in_progress: true,
      due_date: '2026-10-19',
      priority: 4,
      sort_order: 0,
      completed_at: null,
      created_at: '2026-10-19T10:00:00Z',
      updated_at: '2026-10-19T10:00:00Z',
      project: { id: 'p-1', title: 'Computer Science', slug: 'cs' },
    },
    {
      id: 'e1c3e73e-1c2b-5e87-a3f2-567890bcdef0',
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      project_id: null,
      title: 'Hacker Rank Python (3 Questions)',
      description: null,
      is_completed: false,
      in_progress: false,
      due_date: '2026-10-19',
      priority: 4,
      sort_order: 1,
      completed_at: null,
      created_at: '2026-10-19T11:00:00Z',
      updated_at: '2026-10-19T11:00:00Z',
      project: null,
    },
    {
      id: 'f2d4f84f-2d3c-6f98-b403-678901cdef01',
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      project_id: null,
      title: 'Html (20 Pages)',
      description: 'Web development practice',
      is_completed: true,
      in_progress: false,
      due_date: '2026-10-19',
      priority: 4,
      sort_order: 2,
      completed_at: '2026-10-19T12:00:00Z',
      created_at: '2026-10-19T09:00:00Z',
      updated_at: '2026-10-19T12:00:00Z',
      project: null,
    },
  ];

  describe('Validation Schema (updateTaskStatusSchema)', () => {
    it('accepts valid status updates for complete and in_progress', () => {
      const validComplete = updateTaskStatusSchema.safeParse({
        taskId: 'd9b2d62d-0b1a-4d76-92e1-456789abcdef',
        is_completed: true,
      });
      expect(validComplete.success).toBe(true);

      const validInProgress = updateTaskStatusSchema.safeParse({
        taskId: 'd9b2d62d-0b1a-4d76-92e1-456789abcdef',
        in_progress: true,
      });
      expect(validInProgress.success).toBe(true);

      const validCombined = updateTaskStatusSchema.safeParse({
        taskId: 'd9b2d62d-0b1a-4d76-92e1-456789abcdef',
        is_completed: false,
        in_progress: true,
      });
      expect(validCombined.success).toBe(true);
    });

    it('rejects invalid UUID formats', () => {
      const invalid = updateTaskStatusSchema.safeParse({
        taskId: 'not-a-valid-uuid',
        is_completed: true,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('TaskItem Component', () => {
    it('renders a visible, interactive checkbox with role="checkbox"', () => {
      const html = renderToString(
        <TaskItem
          task={mockTasks[1]}
          onToggle={vi.fn()}
          onToggleInProgress={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(html).toContain('role="checkbox"');
      expect(html).toContain('aria-checked="false"');
      expect(html).toContain('aria-label="Mark task complete"');
      expect(html).toContain('Hacker Rank Python (3 Questions)');
      expect(html).not.toContain('line-through');
    });

    it('renders highlighted In Progress state with calming amber styling and pulsing indicator', () => {
      const html = renderToString(
        <TaskItem
          task={mockTasks[0]} // in_progress: true
          onToggle={vi.fn()}
          onToggleInProgress={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(html).toContain('In Progress');
      expect(html).toContain('bg-amber-50');
      expect(html).toContain('text-amber-800');
      expect(html).toContain('animate-pulse');
    });

    it('renders Start button when in_progress is false', () => {
      const html = renderToString(
        <TaskItem
          task={mockTasks[1]} // in_progress: false
          onToggle={vi.fn()}
          onToggleInProgress={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(html).toContain('Start');
      expect(html).toContain('title="Mark In Progress"');
    });

    it('renders completed tasks with strikethrough and aria-checked="true"', () => {
      const html = renderToString(
        <TaskItem
          task={mockTasks[2]} // is_completed: true
          onToggle={vi.fn()}
          onToggleInProgress={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(html).toContain('role="checkbox"');
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('aria-label="Mark task incomplete"');
      expect(html).toContain('line-through');
      expect(html).toContain('text-stone-400');
    });
  });

  describe('TaskChecklist Segregation (Deliverables vs. Completed)', () => {
    it('segregates active and in-progress tasks into Deliverables and completed tasks into Completed Tasks', () => {
      const html = renderToString(
        <TaskChecklist
          initialTasks={mockTasks}
          projects={[]}
        />
      );

      // Section 1: Deliverables
      expect(html).toContain('data-purpose="deliverables-section"');
      expect(html).toContain('Deliverables');
      expect(html).toContain('2 items'); // Complete Java and Hacker Rank Python
      expect(html).toContain('Complete Java');
      expect(html).toContain('Hacker Rank Python');

      // Section 2: Completed Tasks
      expect(html).toContain('data-purpose="completed-tasks-section"');
      expect(html).toContain('Completed Tasks');
      expect(html).toContain('1 item'); // Html (20 Pages)
      expect(html).toContain('Html (20 Pages)');
    });
  });
});
