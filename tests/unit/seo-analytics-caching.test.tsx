import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import NotFound from '@/app/not-found';
import { computeFinancialAnalytics } from '@/lib/finances/compute';
import { computeProjectsMetrics, RawProjectTask, RawProjectTransaction } from '@/lib/projects/compute';
import { getValidSiteUrl, safeUrl, DEFAULT_SITE_URL } from '@/lib/utils/url';
import type { Project } from '@/types/database.types';

describe('Production SEO, Analytics & Edge Caching', () => {
  describe('Custom 404 Error Page', () => {
    it('renders the custom not-found message and return to command center CTA', () => {
      const html = renderToString(<NotFound />);
      expect(html).toContain("This page doesn&#x27;t exist.");
      expect(html).toContain('The link you followed may be broken');
      expect(html).toContain('Return to Command Center');
      expect(html).toContain('href="/"');
    });

    it('renders quick navigation links to primary modules', () => {
      const html = renderToString(<NotFound />);
      expect(html).toContain('href="/tasks"');
      expect(html).toContain('href="/finances"');
      expect(html).toContain('href="/projects"');
      expect(html).toContain('href="/notes"');
    });
  });

  describe('Edge Aggregate Calculations', () => {
    it('computeFinancialAnalytics correctly aggregates zero transactions', () => {
      const analytics = computeFinancialAnalytics([], 10000, '₹');
      expect(analytics.monthlySpent).toBe(0);
      expect(analytics.todaySpent).toBe(0);
      expect(analytics.monthlyAllowance).toBe(10000);
      expect(analytics.safeDailyBudget).toBeGreaterThan(0);
      expect(analytics.currencySymbol).toBe('₹');
    });

    it('computeProjectsMetrics handles zero tasks without NaN / division by zero', () => {
      const mockProjects: Project[] = [
        {
          id: 'proj-1',
          user_id: 'user-1',
          title: 'LifeOS Launch',
          slug: 'lifeos-launch',
          description: null,
          status: 'active',
          priority: 3,
          budget: 500,
          start_date: '2026-10-01',
          target_date: null,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ];
      const mockTasks: RawProjectTask[] = [];
      const mockTransactions: RawProjectTransaction[] = [];

      const metrics = computeProjectsMetrics(mockProjects, mockTasks, mockTransactions);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].total_tasks).toBe(0);
      expect(metrics[0].completed_tasks).toBe(0);
      expect(metrics[0].completion_percentage).toBe(0);
      expect(isNaN(metrics[0].completion_percentage)).toBe(false);
      expect(metrics[0].total_spend).toBe(0);
    });

    it('computeProjectsMetrics computes correct completion percentage and expense spend', () => {
      const mockProjects: Project[] = [
        {
          id: 'proj-1',
          user_id: 'user-1',
          title: 'LifeOS Launch',
          slug: 'lifeos-launch',
          description: null,
          status: 'active',
          priority: 3,
          budget: 500,
          start_date: '2026-10-01',
          target_date: null,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ];
      const mockTasks: RawProjectTask[] = [
        { id: 't1', project_id: 'proj-1', is_completed: true },
        { id: 't2', project_id: 'proj-1', is_completed: false },
        { id: 't3', project_id: 'proj-1', is_completed: true },
        { id: 't4', project_id: 'proj-1', is_completed: false },
      ];
      const mockTransactions: RawProjectTransaction[] = [
        { id: 'tx1', project_id: 'proj-1', amount: -150, type: 'expense' },
        { id: 'tx2', project_id: 'proj-1', amount: -50, type: 'expense' },
        { id: 'tx3', project_id: 'proj-1', amount: 300, type: 'income' },
      ];

      const metrics = computeProjectsMetrics(mockProjects, mockTasks, mockTransactions);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].total_tasks).toBe(4);
      expect(metrics[0].completed_tasks).toBe(2);
      expect(metrics[0].completion_percentage).toBe(50);
      expect(metrics[0].total_spend).toBe(200);
    });
  });

  describe('URL Resilience & Fallbacks (Build-Time /_not-found safety)', () => {
    it('getValidSiteUrl returns guaranteed valid URL when input is missing or malformed', () => {
      expect(getValidSiteUrl(null).toString()).toContain('http');
      expect(getValidSiteUrl('').toString()).toContain('http');
      expect(getValidSiteUrl('   ').toString()).toContain('http');
      expect(getValidSiteUrl('lifeosstudents.vercel.app').origin).toBe('https://lifeosstudents.vercel.app');
      expect(getValidSiteUrl('http://localhost:3000').origin).toBe('http://localhost:3000');
      // Completely invalid URL should fallback without throwing ERR_INVALID_URL
      expect(getValidSiteUrl('://invalid').toString()).toBe(new URL(DEFAULT_SITE_URL).toString());
    });

    it('safeUrl gracefully resolves relative and absolute paths without throwing', () => {
      const parsed1 = safeUrl('/login', 'https://lifeosstudents.vercel.app');
      expect(parsed1.pathname).toBe('/login');

      const parsed2 = safeUrl(null, 'https://lifeosstudents.vercel.app');
      expect(parsed2.pathname).toBe('/');

      const parsed3 = safeUrl('https://example.com/callback');
      expect(parsed3.origin).toBe('https://example.com');
    });
  });
});
