import { describe, it, expect } from 'vitest';
import { parseQuickCapture } from '@/lib/parser/quick-capture';
import { getTodayDate, getTomorrowDate } from '@/lib/utils/date';

describe('parseQuickCapture (TDD Engine)', () => {
  describe('Transaction Tokenizer', () => {
    it('handles standard expense currency prefix ($50 hosting)', () => {
      const res = parseQuickCapture('$50 hosting');
      expect(res.target).toBe('transaction');
      expect(res.payload.amount).toBe(-50);
      expect(res.payload.type).toBe('expense');
      expect(res.payload.description).toBe('hosting');
    });

    it('handles irregular spacing and decimals ($  120.50   domain renewal)', () => {
      const res = parseQuickCapture('  $   120.50   domain renewal  ');
      expect(res.target).toBe('transaction');
      expect(res.payload.amount).toBe(-120.50);
      expect(res.payload.type).toBe('expense');
      expect(res.payload.description).toBe('domain renewal');
    });

    it('handles explicit income signs (+ $2500 consulting client)', () => {
      const res = parseQuickCapture('+$2500 consulting client');
      expect(res.target).toBe('transaction');
      expect(res.payload.amount).toBe(2500);
      expect(res.payload.type).toBe('income');
      expect(res.payload.description).toBe('consulting client');
    });

    it('handles international currency symbols (€, £, ¥, ₹)', () => {
      const resEuro = parseQuickCapture('€85 team lunch');
      expect(resEuro.target).toBe('transaction');
      expect(resEuro.payload.amount).toBe(-85);

      const resPound = parseQuickCapture('+£1200 dividend payout');
      expect(resPound.target).toBe('transaction');
      expect(resPound.payload.amount).toBe(1200);

      const resRupee = parseQuickCapture('₹150 canteen combo');
      expect(resRupee.target).toBe('transaction');
      expect(resRupee.payload.amount).toBe(-150);
      expect(resRupee.payload.description).toBe('canteen combo');
    });

    it('handles trailing currency codes (50 USD dinner)', () => {
      const res = parseQuickCapture('50 USD dinner');
      expect(res.target).toBe('transaction');
      expect(res.payload.amount).toBe(-50);
      expect(res.payload.type).toBe('expense');
      expect(res.payload.description).toBe('dinner');
    });

    it('handles complex overlap: "Buy 50 $1 apples for #party @tomorrow"', () => {
      const res = parseQuickCapture('Buy 50 $1 apples for #party @tomorrow');
      expect(res.target).toBe('transaction');
      expect(res.projectSlug).toBe('party');
      expect(res.payload.amount).toBe(-1);
      expect(res.payload.dueDate).toBeDefined();
      expect(res.payload.description).toContain('Buy 50 apples for');
    });
  });

  describe('Task Tokenizer', () => {
    it('handles "todo: " prefix', () => {
      const res = parseQuickCapture('todo: Configure terraform locks');
      expect(res.target).toBe('task');
      expect(res.payload.title).toBe('Configure terraform locks');
    });

    it('handles case-insensitive "TODO:" prefix with project tag', () => {
      const res = parseQuickCapture('TODO: Deploy staging #cloud-revamp');
      expect(res.target).toBe('task');
      expect(res.projectSlug).toBe('cloud-revamp');
      expect(res.payload.title).toBe('Deploy staging');
    });

    it('handles checklist box "[ ]" and "- [ ]"', () => {
      const res1 = parseQuickCapture('[ ] Fix hydration mismatch in kanban');
      expect(res1.target).toBe('task');
      expect(res1.payload.title).toBe('Fix hydration mismatch in kanban');

      const res2 = parseQuickCapture('- [ ] Run unit test suite');
      expect(res2.target).toBe('task');
      expect(res2.payload.title).toBe('Run unit test suite');
    });

    it('handles relative date tags: @today and @tomorrow', () => {
      const todayStr = getTodayDate();
      const tomorrowStr = getTomorrowDate();

      const resToday = parseQuickCapture('todo: Call accountant @today');
      expect(resToday.target).toBe('task');
      expect(resToday.payload.dueDate).toBe(todayStr);
      expect(resToday.payload.title).toBe('Call accountant');

      const resTomorrow = parseQuickCapture('[ ] Review pull request @tomorrow');
      expect(resTomorrow.target).toBe('task');
      expect(resTomorrow.payload.dueDate).toBe(tomorrowStr);
      expect(resTomorrow.payload.title).toBe('Review pull request');
    });

    it('handles absolute date tag: @2026-11-15', () => {
      const res = parseQuickCapture('todo: Quarterly taxes @2026-11-15 #finance');
      expect(res.target).toBe('task');
      expect(res.projectSlug).toBe('finance');
      expect(res.payload.dueDate).toBe('2026-11-15');
      expect(res.payload.title).toBe('Quarterly taxes');
    });
  });

  describe('Unstructured Notes / Ideas Fallback', () => {
    it('gracefully falls back to note for freeform brainstorm text', () => {
      const text = 'Evaluate vector embeddings using pgvector for personal semantic search';
      const res = parseQuickCapture(text);
      expect(res.target).toBe('note');
      expect(res.payload.content).toBe(text);
      expect(res.payload.title).toBe(text.slice(0, 40) + '...');
    });

    it('extracts project tag even in freeform notes', () => {
      const text = 'Consider switching from k3s to lightweight Nomad containers #infra';
      const res = parseQuickCapture(text);
      expect(res.target).toBe('note');
      expect(res.projectSlug).toBe('infra');
      expect(res.payload.content).toContain('Consider switching from k3s');
    });

    it('avoids false-positive currency on plain numeric descriptions (e.g., "Review 50 test files")', () => {
      const res = parseQuickCapture('Review 50 test files');
      expect(res.target).toBe('note');
      expect(res.payload.content).toBe('Review 50 test files');
    });
  });
});
