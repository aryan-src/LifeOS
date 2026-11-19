import React from 'react';
import { Compass, Lock, CheckCircle2 } from 'lucide-react';
import type { CalibrationProgress } from '@/lib/daily-loop/dashboard-derived';

interface CalibrationHorizonCardProps {
  calibration: CalibrationProgress;
  peakWindowText: string;
}

export function CalibrationHorizonCard({
  calibration,
  peakWindowText,
}: CalibrationHorizonCardProps) {
  const daysTracked = Math.min(calibration.targetDays, Math.max(0, calibration.daysTracked));
  const remainingDays = Math.max(0, calibration.targetDays - daysTracked);
  const isCalibrated = calibration.isCalibrated || daysTracked >= 14;

  return (
    <div
      className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-xs flex flex-col gap-6"
      data-purpose="focus-calibration-card"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-normal font-serif text-on-surface">
            Insights
          </h3>
          <span
            className={`font-mono text-label-sm uppercase tracking-wide font-medium ${
              isCalibrated ? 'text-secondary' : 'text-on-tertiary-container'
            }`}
          >
            {isCalibrated ? 'Active' : 'In progress'}
          </span>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3 border border-outline-variant/20">
        <div className="flex items-center justify-between">
          <span className="font-sans text-label-sm text-on-surface-variant font-medium">
            Progress ({daysTracked} / {calibration.targetDays} days)
          </span>
          <span className="font-mono text-label-md text-on-surface font-semibold tabular-nums">
            {calibration.percent}%
          </span>
        </div>

        {/* Discrete Segmented Bar Gauge (14 blocks) */}
        <div
          className="grid gap-1 w-full"
          style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
          role="progressbar"
          aria-valuenow={calibration.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="14-day focus progress"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={`calib-block-${i}`}
              className={`h-2 rounded-[1px] transition-colors ${
                i < daysTracked ? 'bg-secondary' : 'bg-surface-container-highest'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between font-mono text-label-sm text-on-surface-variant">
          <span>{daysTracked} of 14 days completed</span>
          <span className="tabular-nums">
            {remainingDays > 0 ? `${remainingDays} left` : 'Goal reached'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-sans text-body-md text-on-surface font-medium">
          {isCalibrated ? 'Peak focus window' : 'Insights unlock after 14 days'}
        </p>
        <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
          {peakWindowText ||
            'Log 14 days of focus sessions to discover your peak focus hours and daily patterns.'}
        </p>
      </div>

      <div className="pt-2 flex items-center gap-2 text-on-surface-variant font-mono text-label-sm border-t border-outline-variant/20">
        {isCalibrated ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-secondary" aria-hidden="true" />
            <span className="text-secondary font-medium">Personal insights ready</span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>Unlocks after 14 days</span>
          </>
        )}
      </div>
    </div>
  );
}
