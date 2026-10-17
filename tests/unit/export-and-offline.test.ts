import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  escapeYamlString,
  formatNoteAsMarkdown,
  escapeCsvField,
  formatAsCsv,
  formatTransactionsCsv,
  formatAssignmentsCsv,
  formatTasksCsv,
  formatHabitsCsv,
  createZipArchive,
} from '@/lib/export/formatters';
import {
  queueCapture,
  getQueuedCaptures,
  removeQueuedCapture,
  clearQueuedCaptures,
  flushQueuedCaptures,
  QUEUE_STORAGE_KEY,
} from '@/lib/offline/capture-queue';
import { parseQuickCapture } from '@/lib/parser/quick-capture';

describe('Phase 6: Data Export & Offline Queue Invariants', () => {
  describe('Obsidian-Friendly Markdown Exporter', () => {
    it('escapes YAML frontmatter strings safely when containing quotes and colons', () => {
      expect(escapeYamlString('Simple Title')).toBe('Simple Title');
      expect(escapeYamlString('Title: With Subtitle')).toBe('"Title: With Subtitle"');
      expect(escapeYamlString('Title with "quotes"')).toBe('"Title with \\"quotes\\""');
      expect(escapeYamlString('[Tag] Special')).toBe('"[Tag] Special"');
    });

    it('formats note into complete Obsidian-compatible Markdown with YAML frontmatter', () => {
      const note = {
        id: 'note-123',
        title: 'Algorithms Revision: Graph Theory',
        content: '## Dijkstra Algorithm\n\n- Time complexity: O(V^2)\n- Min-heap optimization: O(E log V)',
        created_at: '2026-10-17T12:00:00.000Z',
        updated_at: '2026-10-17T14:30:00.000Z',
        project: {
          id: 'proj-1',
          title: 'Computer Science Tripos',
          slug: 'cs-tripos',
        },
      };

      const md = formatNoteAsMarkdown(note);
      expect(md).toContain('---');
      expect(md).toContain('title: "Algorithms Revision: Graph Theory"');
      expect(md).toContain('created_at: "2026-10-17T12:00:00.000Z"');
      expect(md).toContain('updated_at: "2026-10-17T14:30:00.000Z"');
      expect(md).toContain('project: Computer Science Tripos');
      expect(md).toContain('source: "LifeOS"');
      expect(md).toContain('## Dijkstra Algorithm');
    });
  });

  describe('RFC-4180 CSV Exporter', () => {
    it('escapes commas, quotes, and newlines strictly compliant with RFC-4180', () => {
      expect(escapeCsvField('normal')).toBe('normal');
      expect(escapeCsvField('apples, oranges')).toBe('"apples, oranges"');
      expect(escapeCsvField('15" laptop')).toBe('"15"" laptop"');
      expect(escapeCsvField('line 1\nline 2')).toBe('"line 1\nline 2"');
      expect(escapeCsvField(null)).toBe('');
      expect(escapeCsvField(undefined)).toBe('');
      expect(escapeCsvField(42)).toBe('42');
    });

    it('formats transaction rows with proper escaping and category relation', () => {
      const transactions = [
        {
          id: 'tx-1',
          date: '2026-10-17',
          amount: -150.5,
          type: 'expense',
          description: 'Hostinger, Cloudflare & Domain',
          category: { name: 'Infrastructure, Hosting' },
        },
        {
          id: 'tx-2',
          date: '2026-10-18',
          amount: 2500,
          type: 'income',
          description: 'Consulting "Staging" Client',
          category: null,
        },
      ];

      const csv = formatTransactionsCsv(transactions);
      const lines = csv.split('\r\n');
      expect(lines[0]).toBe('ID,Date,Type,Amount,Description,Category');
      expect(lines[1]).toContain('"Hostinger, Cloudflare & Domain"');
      expect(lines[1]).toContain('"Infrastructure, Hosting"');
      expect(lines[2]).toContain('"Consulting ""Staging"" Client"');
      expect(lines[2]).toContain('Uncategorized');
    });

    it('formats assignments into CSV table', () => {
      const assignments = [
        {
          id: 'asg-1',
          title: 'Quantum Mechanics Lab',
          subject: 'Physics',
          due_date: '2026-10-25',
          status: 'pending',
          marks_achieved: null,
          total_marks: 100,
          project: { title: 'Physics Semester 1' },
        },
      ];

      const csv = formatAssignmentsCsv(assignments);
      expect(csv).toContain('ID,Subject,Title,Due Date,Status,Marks Achieved,Total Marks,Project');
      expect(csv).toContain('Quantum Mechanics Lab');
      expect(csv).toContain('Physics Semester 1');
    });

    it('formats tasks and habits into CSV tables', () => {
      const tasks = [
        {
          id: 'tsk-1',
          title: 'Review pull request',
          is_completed: false,
          priority: 1,
          due_date: '2026-10-18',
          created_at: '2026-10-17T10:00:00Z',
        },
      ];
      const tasksCsv = formatTasksCsv(tasks);
      expect(tasksCsv).toContain('Review pull request');
      expect(tasksCsv).toContain('No');

      const habits = [
        {
          id: 'hbt-1',
          title: 'Morning Run',
          description: 'Daily 5km aerobic jog',
          created_at: '2026-10-17T10:00:00Z',
        },
      ];
      const habitsCsv = formatHabitsCsv(habits);
      expect(habitsCsv).toContain('Morning Run');
      expect(habitsCsv).toContain('Daily 5km aerobic jog');
    });
  });

  describe('Zero-Dependency ZIP Archive Generator', () => {
    it('generates a valid binary ZIP blob with standard PK signatures', async () => {
      const files = [
        { name: 'hello.txt', content: 'Hello World' },
        { name: 'note.md', content: '# Markdown Note' },
      ];

      const blob = createZipArchive(files);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/zip');
      expect(blob.size).toBeGreaterThan(0);

      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Verify PK\x03\x04 signature at offset 0
      expect(bytes[0]).toBe(0x50); // 'P'
      expect(bytes[1]).toBe(0x4b); // 'K'
      expect(bytes[2]).toBe(0x03);
      expect(bytes[3]).toBe(0x04);
    });
  });

  describe('Offline Quick-Capture Queue', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
      mockStore = {};
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => mockStore[key] || null),
        setItem: vi.fn((key: string, val: string) => {
          mockStore[key] = val;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStore[key];
        }),
        clear: vi.fn(() => {
          mockStore = {};
        }),
      });
    });

    it('queues capture entries in FIFO order', () => {
      const item1 = queueCapture('$45 groceries #food');
      const item2 = queueCapture('todo: Read paper @tomorrow');

      const queue = getQueuedCaptures();
      expect(queue.length).toBe(2);
      expect(queue[0].id).toBe(item1.id);
      expect(queue[0].rawInput).toBe('$45 groceries #food');
      expect(queue[1].id).toBe(item2.id);
    });

    it('removes specific items by ID and clears queue', () => {
      const item1 = queueCapture('Entry 1');
      const item2 = queueCapture('Entry 2');

      removeQueuedCapture(item1.id);
      let queue = getQueuedCaptures();
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe(item2.id);

      clearQueuedCaptures();
      queue = getQueuedCaptures();
      expect(queue.length).toBe(0);
    });

    it('flushes queued captures via dispatcher and removes synced entries', async () => {
      queueCapture('$15 breakfast');
      queueCapture('todo: Review code');

      const mockDispatcher = vi.fn().mockResolvedValue({
        success: true,
        data: { message: 'Synced' },
      });

      const { synced, failed } = await flushQueuedCaptures(mockDispatcher);
      expect(synced).toBe(2);
      expect(failed).toBe(0);
      expect(mockDispatcher).toHaveBeenCalledTimes(2);

      const remaining = getQueuedCaptures();
      expect(remaining.length).toBe(0);
    });
  });

  describe('Quick-Capture Parser Latency Benchmarking', () => {
    it('executes complex input parsing in under 5ms', () => {
      const complexInput = 'CS102: Distributed Systems Lab @2026-11-20 #assignment #computer-science';

      const start = performance.now();
      const res = parseQuickCapture(complexInput);
      const duration = performance.now() - start;

      expect(res.target).toBe('assignment');
      expect(res.payload.subject).toBe('CS102');
      expect(res.projectSlug).toBe('computer-science');
      expect(duration).toBeLessThan(5); // Well within ultra-fast real-time boundary
    });
  });
});
