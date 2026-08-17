'use client';

import React from 'react';

import { LIFECYCLE_STAGES, type LifecycleCounts, type LifecycleStage } from '@/lib/vendor/lifecycle';

export type { LifecycleStage, LifecycleCounts };

interface LifecycleStepperProps {
  currentStage?: LifecycleStage;
  onSelectStage?: (stage: LifecycleStage) => void;
  counts?: LifecycleCounts;
}

export function LifecycleStepper({
  currentStage = 'ALL',
  onSelectStage,
  counts = {},
}: LifecycleStepperProps) {
  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto rounded-xl border border-amber-200/60 bg-amber-50/40 p-2.5 shadow-sm">
      {LIFECYCLE_STAGES.map((stage, idx) => {
        const isActive = currentStage === stage.key;
        const count = counts[stage.key] ?? 0;

        return (
          <React.Fragment key={stage.key}>
            <button
              type="button"
              onClick={() => onSelectStage?.(stage.key === currentStage ? 'ALL' : stage.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                  : 'bg-amber-100/70 text-slate-700 hover:bg-amber-200/80 hover:text-slate-900'
              }`}
            >
              <span>{stage.label}</span>
              {count > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                    isActive ? 'bg-white text-amber-600' : 'bg-amber-300 text-slate-900'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
            {idx < LIFECYCLE_STAGES.length - 1 ? (
              <span className="shrink-0 text-xs font-bold text-amber-400" aria-hidden>
                →
              </span>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default LifecycleStepper;
