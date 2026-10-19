import { z } from 'zod';

/**
 * Common format helper for Zod validation errors to ActionResponse string
 */
export function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (firstIssue) {
    return firstIssue.message || 'Validation error';
  }
  return 'Invalid input data.';
}

// -------------------------------------------------------------
// Common Primitives
// -------------------------------------------------------------
export const uuidSchema = z.string().uuid({ message: 'Invalid ID format.' });
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be formatted strictly as YYYY-MM-DD.',
});

// -------------------------------------------------------------
// Tasks Schemas
// -------------------------------------------------------------
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Task title is required.' })
    .max(255, { message: 'Task title cannot exceed 255 characters.' }),
  description: z
    .string()
    .trim()
    .max(2000, { message: 'Description cannot exceed 2000 characters.' })
    .optional()
    .nullable(),
  dueDate: isoDateSchema.optional().nullable(),
  priority: z.coerce.number().int().min(1).max(4).default(2),
  projectId: z
    .string()
    .uuid({ message: 'Invalid project ID.' })
    .optional()
    .nullable()
    .or(z.literal('none').transform(() => null)),
});

export const toggleTaskSchema = z.object({
  taskId: uuidSchema,
  targetCompletedState: z.boolean(),
});

export const updateTaskStatusSchema = z.object({
  taskId: uuidSchema,
  is_completed: z.boolean().optional(),
  in_progress: z.boolean().optional(),
});

export const updateTaskPrioritySchema = z.object({
  taskId: uuidSchema,
  priority: z.coerce.number().int().min(1).max(4),
});

export const deleteTaskSchema = z.object({
  taskId: uuidSchema,
});

// -------------------------------------------------------------
// Finances Schemas
// -------------------------------------------------------------
export const transactionTypeEnum = z.enum(['income', 'expense', 'transfer']);

export const createTransactionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, { message: 'Description is required.' })
    .max(255, { message: 'Description cannot exceed 255 characters.' }),
  amount: z.coerce
    .number()
    .finite({ message: 'Amount must be a finite number.' })
    .positive({ message: 'Please enter a valid positive amount.' }),
  type: transactionTypeEnum.default('expense'),
  date: isoDateSchema.optional().nullable(),
  categoryId: z
    .string()
    .uuid({ message: 'Invalid category ID.' })
    .optional()
    .nullable()
    .or(z.literal('none').transform(() => null)),
  projectId: z
    .string()
    .uuid({ message: 'Invalid project ID.' })
    .optional()
    .nullable()
    .or(z.literal('none').transform(() => null)),
  payeeOrSource: z
    .string()
    .trim()
    .max(100, { message: 'Payee or source cannot exceed 100 characters.' })
    .optional()
    .nullable(),
});

export const updateTransactionSchema = z.object({
  id: uuidSchema,
  description: z
    .string()
    .trim()
    .min(1, { message: 'Description is required.' })
    .max(255, { message: 'Description cannot exceed 255 characters.' }),
  amount: z.coerce
    .number()
    .finite({ message: 'Amount must be a finite number.' })
    .positive({ message: 'Please enter a valid positive amount.' }),
  type: transactionTypeEnum.default('expense'),
  date: isoDateSchema.optional().nullable(),
  categoryId: z
    .string()
    .uuid({ message: 'Invalid category ID.' })
    .optional()
    .nullable()
    .or(z.literal('none').transform(() => null)),
  projectId: z
    .string()
    .uuid({ message: 'Invalid project ID.' })
    .optional()
    .nullable()
    .or(z.literal('none').transform(() => null)),
  payeeOrSource: z
    .string()
    .trim()
    .max(100, { message: 'Payee or source cannot exceed 100 characters.' })
    .optional()
    .nullable(),
});

export const deleteTransactionSchema = z.object({
  transactionId: uuidSchema,
});

// -------------------------------------------------------------
// Notes Schemas
// -------------------------------------------------------------
export const createNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .max(255, { message: 'Title cannot exceed 255 characters.' })
    .transform((val) => val || 'Untitled Note'),
  content: z
    .string()
    .trim()
    .max(50000, { message: 'Note content cannot exceed 50,000 characters.' })
    .default(''),
  tags: z.array(z.string().trim().max(50)).default([]),
});

export const togglePinNoteSchema = z.object({
  noteId: uuidSchema,
  isPinned: z.boolean(),
});

export const deleteNoteSchema = z.object({
  noteId: uuidSchema,
});

export const promoteNoteSchema = z.object({
  noteId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(1, { message: 'Project title cannot be empty.' })
    .max(255)
    .optional(),
  description: z.string().max(50000).optional().nullable(),
  priority: z.coerce.number().int().min(1).max(4).optional(),
  budget: z.coerce.number().finite().nonnegative().optional(),
});

// -------------------------------------------------------------
// Projects Schemas
// -------------------------------------------------------------
export const projectStatusEnum = z.enum(['backlog', 'active', 'paused', 'completed']);

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Project title is required.' })
    .max(120, { message: 'Project title cannot exceed 120 characters.' }),
  description: z
    .string()
    .trim()
    .max(5000, { message: 'Description cannot exceed 5000 characters.' })
    .optional()
    .nullable(),
  status: projectStatusEnum.default('active'),
  priority: z.coerce.number().int().min(1).max(4).default(2),
  budget: z.coerce
    .number()
    .finite({ message: 'Budget must be a finite number.' })
    .nonnegative({ message: 'Budget must be zero or a positive amount.' })
    .default(0),
  targetDate: isoDateSchema.optional().nullable(),
});

export const updateProjectStatusSchema = z.object({
  projectId: uuidSchema,
  status: projectStatusEnum,
});

export const deleteProjectSchema = z.object({
  projectId: uuidSchema,
});

// -------------------------------------------------------------
// Assignments Schemas
// -------------------------------------------------------------
export const assignmentStatusEnum = z.enum([
  'not_started',
  'in_progress',
  'submission_pending',
  'submitted',
  'graded',
]);

export const createAssignmentSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, { message: 'Subject is required.' })
    .max(100, { message: 'Subject cannot exceed 100 characters.' }),
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required.' })
    .max(200, { message: 'Title cannot exceed 200 characters.' }),
  due_date: isoDateSchema.optional().nullable(),
  status: assignmentStatusEnum.default('not_started'),
  project_id: uuidSchema.optional().nullable(),
  marks_achieved: z.coerce.number().finite().nonnegative().optional().nullable(),
  total_marks: z.coerce.number().finite().positive().optional().nullable(),
});

export const updateAssignmentStatusSchema = z.object({
  id: uuidSchema,
  status: assignmentStatusEnum,
});

export const gradeAssignmentSchema = z
  .object({
    id: uuidSchema,
    marks_achieved: z.coerce
      .number()
      .finite({ message: 'Marks achieved must be a finite number.' })
      .nonnegative({ message: 'Marks achieved cannot be negative.' }),
    total_marks: z.coerce
      .number()
      .finite({ message: 'Total marks must be a finite number.' })
      .positive({ message: 'Total marks must be greater than zero.' }),
  })
  .refine((data) => data.marks_achieved <= data.total_marks, {
    message: 'Marks achieved cannot exceed total marks.',
  });

export const deleteAssignmentSchema = z.object({
  id: uuidSchema,
});

// -------------------------------------------------------------
// Habits Schemas
// -------------------------------------------------------------
export const createHabitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Habit title is required.' })
    .max(100, { message: 'Habit title cannot exceed 100 characters.' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Description cannot exceed 500 characters.' })
    .optional()
    .nullable(),
});

export const toggleHabitLogSchema = z.object({
  habitId: uuidSchema,
  dateStr: isoDateSchema,
});

export const deleteHabitSchema = z.object({
  habitId: uuidSchema,
});

// -------------------------------------------------------------
// Quick Capture Schemas
// -------------------------------------------------------------
export const quickCaptureSchema = z.object({
  rawInput: z
    .string()
    .trim()
    .min(1, { message: 'Input cannot be empty.' })
    .max(1000, { message: 'Input is too long.' }),
});

// -------------------------------------------------------------
// Profile Schemas
// -------------------------------------------------------------
export const themePreferenceEnum = z.enum([
  'stone',
  'light',
  'dark',
  'crimson-cream',
  'crimson-dark',
  'crimson-light',
  'default',
]);

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { message: 'Display name cannot be empty.' })
    .max(100, { message: 'Display name cannot exceed 100 characters.' })
    .default('Student'),
  currencySymbol: z
    .string()
    .trim()
    .min(1, { message: 'Currency symbol cannot be empty.' })
    .max(5, { message: 'Currency symbol too long.' })
    .default('₹'),
  themePreference: themePreferenceEnum.default('default'),
  monthlyAllowanceTarget: z.coerce
    .number()
    .finite({ message: 'Allowance target must be a finite number.' })
    .nonnegative({ message: 'Allowance target cannot be negative.' })
    .default(15000),
});
