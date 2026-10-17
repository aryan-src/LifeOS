import { describe, it, expect } from 'vitest';
import {
  createTaskSchema,
  toggleTaskSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createNoteSchema,
  createProjectSchema,
  createAssignmentSchema,
  gradeAssignmentSchema,
  createHabitSchema,
  toggleHabitLogSchema,
  quickCaptureSchema,
  updateProfileSchema,
  formatZodError,
} from '@/lib/validations';

describe('Server Action Zod Validation Schemas', () => {
  describe('Tasks Validations', () => {
    it('rejects empty or whitespace-only task title', () => {
      const res = createTaskSchema.safeParse({ title: '   ' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(formatZodError(res.error)).toContain('Task title is required');
      }
    });

    it('rejects invalid project UUID', () => {
      const res = createTaskSchema.safeParse({
        title: 'Valid task title',
        projectId: 'not-a-uuid',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(formatZodError(res.error)).toContain('Invalid project ID');
      }
    });

    it('accepts valid task input with null/none project ID', () => {
      const res = createTaskSchema.safeParse({
        title: 'Clean task',
        priority: '3',
        dueDate: '2026-10-18',
        projectId: 'none',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.title).toBe('Clean task');
        expect(res.data.priority).toBe(3);
        expect(res.data.projectId).toBeNull();
      }
    });

    it('rejects invalid UUID in toggleTaskSchema', () => {
      const res = toggleTaskSchema.safeParse({
        taskId: 'invalid-id',
        targetCompletedState: true,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('Finances Validations', () => {
    it('rejects negative transaction amount', () => {
      const res = createTransactionSchema.safeParse({
        description: 'Coffee',
        amount: '-150',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(formatZodError(res.error)).toContain('positive amount');
      }
    });

    it('rejects zero or non-numeric amount', () => {
      const zeroRes = createTransactionSchema.safeParse({
        description: 'Snack',
        amount: '0',
      });
      expect(zeroRes.success).toBe(false);

      const nanRes = createTransactionSchema.safeParse({
        description: 'Snack',
        amount: 'abc',
      });
      expect(nanRes.success).toBe(false);
    });

    it('rejects empty description', () => {
      const res = createTransactionSchema.safeParse({
        description: '   ',
        amount: '200',
      });
      expect(res.success).toBe(false);
    });

    it('rejects invalid transaction type enum', () => {
      const res = createTransactionSchema.safeParse({
        description: 'Bonus',
        amount: '500',
        type: 'crypto_swap',
      });
      expect(res.success).toBe(false);
    });

    it('accepts valid transaction input', () => {
      const res = createTransactionSchema.safeParse({
        description: 'Semester textbooks',
        amount: '2400.50',
        type: 'expense',
        date: '2026-10-17',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.amount).toBe(2400.50);
        expect(res.data.type).toBe('expense');
      }
    });
  });

  describe('Notes Validations', () => {
    it('trims title and defaults to Untitled Note when title is empty', () => {
      const res = createNoteSchema.safeParse({
        title: '',
        content: '# Ideas',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.title).toBe('Untitled Note');
      }
    });

    it('rejects note with oversized content exceeding 50k chars', () => {
      const oversized = 'a'.repeat(50001);
      const res = createNoteSchema.safeParse({
        title: 'Huge Note',
        content: oversized,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('Projects Validations', () => {
    it('rejects empty project title', () => {
      const res = createProjectSchema.safeParse({
        title: '   ',
      });
      expect(res.success).toBe(false);
    });

    it('rejects negative project budget', () => {
      const res = createProjectSchema.safeParse({
        title: 'Autonomous Rover',
        budget: '-500',
      });
      expect(res.success).toBe(false);
    });

    it('rejects invalid project status', () => {
      const res = createProjectSchema.safeParse({
        title: 'Autonomous Rover',
        status: 'archived_forever',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('Assignments Validations', () => {
    it('rejects assignment without subject or title', () => {
      const res = createAssignmentSchema.safeParse({
        subject: '',
        title: '',
      });
      expect(res.success).toBe(false);
    });

    it('rejects marks achieved greater than total marks', () => {
      const res = gradeAssignmentSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        marks_achieved: 105,
        total_marks: 100,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(formatZodError(res.error)).toContain('cannot exceed total marks');
      }
    });

    it('rejects negative marks achieved or zero total marks', () => {
      const negRes = gradeAssignmentSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        marks_achieved: -5,
        total_marks: 100,
      });
      expect(negRes.success).toBe(false);

      const zeroTotalRes = gradeAssignmentSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        marks_achieved: 0,
        total_marks: 0,
      });
      expect(zeroTotalRes.success).toBe(false);
    });

    it('accepts valid grading input', () => {
      const res = gradeAssignmentSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        marks_achieved: 88.5,
        total_marks: 100,
      });
      expect(res.success).toBe(true);
    });
  });

  describe('Habits Validations', () => {
    it('rejects empty habit title', () => {
      const res = createHabitSchema.safeParse({
        title: '   ',
      });
      expect(res.success).toBe(false);
    });

    it('rejects invalid habit log date format', () => {
      const res = toggleHabitLogSchema.safeParse({
        habitId: '123e4567-e89b-12d3-a456-426614174000',
        dateStr: '17-10-2026',
      });
      expect(res.success).toBe(false);
    });

    it('accepts valid habit toggle input', () => {
      const res = toggleHabitLogSchema.safeParse({
        habitId: '123e4567-e89b-12d3-a456-426614174000',
        dateStr: '2026-10-17',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('Quick Capture & Profile Validations', () => {
    it('rejects empty quick capture input', () => {
      const res = quickCaptureSchema.safeParse({ rawInput: '   ' });
      expect(res.success).toBe(false);
    });

    it('accepts valid quick capture input', () => {
      const res = quickCaptureSchema.safeParse({ rawInput: 'Buy books ₹450 #college' });
      expect(res.success).toBe(true);
    });

    it('rejects negative monthly allowance target', () => {
      const res = updateProfileSchema.safeParse({
        displayName: 'Aryan',
        monthlyAllowanceTarget: -500,
      });
      expect(res.success).toBe(false);
    });

    it('accepts valid profile update input with crimson themes', () => {
      const res = updateProfileSchema.safeParse({
        displayName: 'Aryan',
        currencySymbol: '₹',
        themePreference: 'crimson-dark',
        monthlyAllowanceTarget: '20000',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.themePreference).toBe('crimson-dark');
        expect(res.data.monthlyAllowanceTarget).toBe(20000);
      }
    });
  });
});
