import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User } from '@supabase/supabase-js';

const mockRpc = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

import { deleteAccountAction } from '@/lib/actions/profile';
import { DEV_BYPASS_MUTATION_ERROR } from '@/lib/supabase/dev-auth';

describe('deleteAccountAction Server Action', () => {
  const originalEnv = { ...process.env };
  const mockUser: User = {
    id: 'user-delete-test-id',
    email: 'student.maya@university.edu',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects unauthenticated caller in production with Unauthorized error', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('No session'),
    });

    const res = await deleteAccountAction('DELETE');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Unauthorized');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('blocks account deletion in dev bypass mode with DEV_BYPASS_MUTATION_ERROR', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    process.env.DEV_BYPASS_AUTH = 'true';

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const res = await deleteAccountAction('DELETE');
    expect(res.success).toBe(false);
    expect(res.error).toBe(DEV_BYPASS_MUTATION_ERROR);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects client-supplied email that differs from the session email', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const res = await deleteAccountAction('other.person@university.edu');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Confirmation does not match your account email or DELETE.');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects arbitrary or invalid confirmation text', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const res = await deleteAccountAction('random text');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Confirmation does not match your account email or DELETE.');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('accepts matching user session email (case-insensitive and trimmed), calls RPC and signs out', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const res = await deleteAccountAction('  STUDENT.MAYA@UNIVERSITY.EDU  ');
    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('delete_my_account');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('accepts literal DELETE confirmation (case-insensitive and trimmed)', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const res = await deleteAccountAction('  delete  ');
    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('delete_my_account');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('still returns success even if signOut throws an error after RPC completes', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSignOut.mockRejectedValue(new Error('User session not found on server'));

    const res = await deleteAccountAction('DELETE');
    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('delete_my_account');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('returns failure when delete_my_account RPC returns an error', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Database transaction lock timeout' },
    });

    const res = await deleteAccountAction('DELETE');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Database transaction lock timeout');
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
