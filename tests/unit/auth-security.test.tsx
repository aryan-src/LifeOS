import { describe, it, expect, vi } from 'vitest';
import { requireUserId, UnauthorizedError, getOptionalUserId } from '@/lib/auth/user';

describe('Auth Security & User Resolution', () => {
  it('throws UnauthorizedError when user is unauthenticated', async () => {
    const mockSupabaseUnauth = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No session') }),
      },
    };

    await expect(requireUserId(mockSupabaseUnauth as unknown as Parameters<typeof requireUserId>[0])).rejects.toThrow(UnauthorizedError);
  });

  it('returns user ID when authenticated', async () => {
    const mockSupabaseAuth = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-123' } },
          error: null,
        }),
      },
    };

    const userId = await requireUserId(mockSupabaseAuth as unknown as Parameters<typeof requireUserId>[0]);
    expect(userId).toBe('test-user-123');
  });

  it('getOptionalUserId returns null when unauthenticated', async () => {
    const mockSupabaseUnauth = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };

    const userId = await getOptionalUserId(mockSupabaseUnauth as unknown as Parameters<typeof getOptionalUserId>[0]);
    expect(userId).toBeNull();
  });
});
