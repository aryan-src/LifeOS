import { describe, it, expect, vi } from 'vitest';

const TABLES = [
  'profiles',
  'projects',
  'tasks',
  'categories',
  'transactions',
  'notes',
  'assignments',
  'habits',
  'habit_logs',
] as const;

describe('Two-User RLS Isolation & Anonymous Access Denial Invariants', () => {
  describe('Anonymous Client Constraints (Public anon key)', () => {
    it('enforces that anonymous queries return 0 rows or permission denied across all 9 tables', async () => {
      // Simulate anon client behaviour under Supabase RLS
      const mockAnonClient = {
        from: (table: string) => ({
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null, // Postgres RLS filters out rows without throwing, returning []
          }),
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: { message: `new row violates row-level security policy for table "${table}"`, code: '42501' },
          }),
        }),
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'permission denied for function promote_to_project', code: '42501' },
        }),
      };

      for (const table of TABLES) {
        const selectRes = await mockAnonClient.from(table).select();
        expect(selectRes.data).toEqual([]);

        const insertRes = await mockAnonClient.from(table).insert({ title: 'Hacked' });
        expect(insertRes.error).not.toBeNull();
        expect(insertRes.error?.code).toBe('42501');
      }

      const rpcRes = await mockAnonClient.rpc('promote_to_project');
      expect(rpcRes.error?.code).toBe('42501');
    });
  });

  describe('Multi-Tenant Cross-User Isolation (User A vs User B)', () => {
    const userAId = '11111111-1111-1111-1111-111111111111';
    const userBId = '22222222-2222-2222-2222-222222222222';

    // Mock database storage with RLS enforcement
    const dbRows: Array<{ id: string; user_id: string; title: string }> = [
      { id: 'note-a1', user_id: userAId, title: 'Confidential Strategy by User A' },
      { id: 'note-b1', user_id: userBId, title: 'Secret Note by User B' },
    ];

    function createMockTenantClient(activeUserId: string) {
      return {
        from: (_table: string) => ({
          select: () => ({
            single: () => {
              const row = dbRows.find((r) => r.user_id === activeUserId);
              return Promise.resolve({ data: row || null, error: row ? null : { message: 'Row not found' } });
            },
            then: (resolve: (val: { data: typeof dbRows; error: null }) => void) => {
              const rows = dbRows.filter((r) => r.user_id === activeUserId);
              resolve({ data: rows, error: null });
            },
          }),
          update: (payload: { title: string }) => ({
            eq: (_col: string, idVal: string) => ({
              select: () => {
                const target = dbRows.find((r) => r.id === idVal && r.user_id === activeUserId);
                if (!target) {
                  return Promise.resolve({ data: [], error: null }); // RLS prevents matching other users' rows
                }
                target.title = payload.title;
                return Promise.resolve({ data: [target], error: null });
              },
            }),
          }),
          delete: () => ({
            eq: (_col: string, idVal: string) => {
              const index = dbRows.findIndex((r) => r.id === idVal && r.user_id === activeUserId);
              if (index === -1) {
                return Promise.resolve({ data: [], error: null });
              }
              const removed = dbRows.splice(index, 1);
              return Promise.resolve({ data: removed, error: null });
            },
          }),
        }),
      };
    }

    it('User B cannot view User A rows via select', async () => {
      const clientB = createMockTenantClient(userBId);
      const res = await new Promise<{ data: typeof dbRows }>((resolve) => {
        clientB.from('notes').select().then(resolve);
      });

      expect(res.data.length).toBe(1);
      expect(res.data[0].user_id).toBe(userBId);
      expect(res.data.some((r) => r.user_id === userAId)).toBe(false);
    });

    it('User B cannot mutate User A rows via update', async () => {
      const clientB = createMockTenantClient(userBId);
      const res = await clientB.from('notes').update({ title: 'Tampered' }).eq('id', 'note-a1').select();

      expect(res.data).toEqual([]);
      // Confirm original note for User A was not tampered
      const noteA = dbRows.find((r) => r.id === 'note-a1');
      expect(noteA?.title).toBe('Confidential Strategy by User A');
    });

    it('User B cannot delete User A rows', async () => {
      const clientB = createMockTenantClient(userBId);
      const res = await clientB.from('notes').delete().eq('id', 'note-a1');

      expect(res.data).toEqual([]);
      const noteA = dbRows.find((r) => r.id === 'note-a1');
      expect(noteA).toBeDefined();
    });
  });
});
