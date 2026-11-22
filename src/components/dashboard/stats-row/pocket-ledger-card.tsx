'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { ProgressBar } from '@/components/ui/progress-bar';
import { computeBudgetUtilization } from '@/lib/daily-loop/dashboard-derived';

interface PocketLedgerCardProps {
  pocketLedger: {
    spentAmount: number;
    monthlyAllowance: number;
    remainingAllowance: number;
    allowancePercent: number;
    currentMonth: string;
  };
  todayDateStr?: string;
}

export function PocketLedgerCard({
  pocketLedger,
  todayDateStr = '',
}: PocketLedgerCardProps) {
  const { spentAmount, remainingAllowance, monthlyAllowance, currentMonth } = pocketLedger;
  const derived = computeBudgetUtilization(
    spentAmount,
    monthlyAllowance,
    todayDateStr || new Date().toISOString().slice(0, 10)
  );

  const isLimitSet = monthlyAllowance > 0;

  return (
    <Link
      href="/settings"
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
      aria-label={isLimitSet ? "Open Expenses" : "Set monthly limit in Settings"}
    >
      <Card
        padding="md"
        surface="lowest"
        interactive={true}
        className="flex h-full flex-col justify-between gap-3 min-w-0"
        data-purpose="pocket-ledger-card"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
            Pocket money
          </span>
          <Pill tone="neutral">{currentMonth}</Pill>
        </div>

        {isLimitSet ? (
          <>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span
                className="font-mono text-numeric-timer font-semibold tracking-tight text-on-surface truncate"
                style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
              >
                ₹{Math.round(remainingAllowance).toLocaleString('en-IN')}
              </span>
              <span
                className="font-sans text-body-sm text-on-surface-variant shrink-0"
                style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
              >
                left of ₹{Math.round(monthlyAllowance).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-2">
              <ProgressBar
                value={derived.percentUtilized}
                tone={derived.tone}
                size="xs"
                label="Monthly allowance utilization"
              />
              <div className="flex items-center justify-between font-mono text-label-sm text-on-surface-variant">
                <span style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
                  ₹{derived.safeDailyPace.toLocaleString('en-IN')}/day safe pace
                </span>
                <span style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
                  {derived.daysLeftInMonth}d left
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1 py-1">
              <span className="font-sans text-body-md font-semibold text-on-surface">
                Set your monthly limit
              </span>
              <p className="font-sans text-body-xs text-on-surface-variant line-clamp-2">
                Establish a monthly budget to track spending pace and safe daily allowance.
              </p>
            </div>

            <div className="flex items-center justify-between font-mono text-label-sm pt-2 border-t border-outline-variant/30">
              <span className="text-secondary font-medium">Set limit →</span>
              <span className="text-outline">Pace untracked</span>
            </div>
          </>
        )}
      </Card>
    </Link>
  );
}
