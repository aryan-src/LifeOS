import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User } from '@supabase/supabase-js';

const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

import { createCategory } from '@/lib/actions/finances';
import { DEV_BYPASS_MUTATION_ERROR } from '@/lib/supabase/dev-auth';

describe('createCategory Server Action', () => {
  const originalEnv = { ...process.env };
  const mockUser = { id: 'usr-456-abc', email: 'student@lifeos.dev' } as User;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects unauthenticated user when no session exists in production', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Auth session missing'),
    });

    const res = await createCategory('Stationery');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Unauthorized');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects mutations in dev bypass mode', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    process.env.DEV_BYPASS_AUTH = 'true';

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const res = await createCategory('Stationery');
    expect(res.success).toBe(false);
    expect(res.error).toBe(DEV_BYPASS_MUTATION_ERROR);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects empty or whitespace-only category names without querying DB', async () => {
    const resEmpty = await createCategory('');
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.error).toBe('Category name is required');

    const resWhitespace = await createCategory('     ');
    expect(resWhitespace.success).toBe(false);
    expect(resWhitespace.error).toBe('Category name is required');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects category names longer than 50 characters', async () => {
    const longName = 'A'.repeat(51);
    const res = await createCategory(longName);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Category name must be 50 characters or fewer');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('prevents duplicate category names for the same user and type via safe in-memory check', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'existing-cat-id', name: 'books' }],
            error: null,
          }),
        }),
      }),
    });

    const res = await createCategory('  Books  ', 'expense');
    expect(res.success).toBe(false);
    expect(res.error).toBe('A category with this name already exists');
  });

  it('does not falsely match category names containing underscores and percent signs', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'new-cat-wildcard',
            user_id: mockUser.id,
            name: 'Books_10%',
            type: 'expense',
            color: null,
            monthly_budget: null,
            created_at: '2026-11-22T00:00:00Z',
          },
          error: null,
        }),
      }),
    });

    // An ILIKE query with 'Books_10%' would falsely match 'Books 100' or 'Books-109'
    // but the in-memory normalized comparison does not treat '_' and '%' as wildcards.
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'cat-1', name: 'Books 100' },
              { id: 'cat-2', name: 'Books_20%' },
            ],
            error: null,
          }),
        }),
      }),
      insert: insertMock,
    });

    const res = await createCategory('Books_10%', 'expense');
    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('Books_10%');
    expect(insertMock).toHaveBeenCalledWith({
      user_id: mockUser.id,
      name: 'Books_10%',
      type: 'expense',
      color: null,
    });
  });

  it('handles unique constraint violation error 23505 gracefully if concurrent insert happens', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' },
          }),
        }),
      }),
    });

    const res = await createCategory('Books', 'expense');
    expect(res.success).toBe(false);
    expect(res.error).toBe('A category with this name already exists');
  });

  it('successfully creates trimmed category with user_id matching authenticated user and triggers revalidations', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'new-cat-123',
            user_id: mockUser.id,
            name: 'Art Supplies',
            type: 'expense',
            color: '#8b5cf6',
            monthly_budget: null,
            created_at: '2026-11-22T00:00:00Z',
          },
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
      insert: insertMock,
    });

    const res = await createCategory('  Art Supplies  ', 'expense', '#8b5cf6');

    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('Art Supplies');
    expect(res.data?.user_id).toBe(mockUser.id);
    expect(insertMock).toHaveBeenCalledWith({
      user_id: mockUser.id,
      name: 'Art Supplies',
      type: 'expense',
      color: '#8b5cf6',
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/finances');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});
