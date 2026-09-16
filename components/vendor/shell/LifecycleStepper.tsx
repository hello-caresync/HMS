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
    <div className="flex w-full items-center gap-2 overflow-x-auto rounded-xl border border-[#dcc2f9]/70 bg-[#faf7fe]/80 p-2.5 shadow-sm">
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
                  ? 'bg-vendor-primary text-white shadow-sm ring-2 ring-[#ceaef2]'
                  : 'bg-[#dcc2f9]/50 text-vendor-charcoal hover:bg-[#ceaef2]/40 hover:text-vendor-charcoal'
              }`}
            >
              <span>{stage.label}</span>
              {count > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                    isActive ? 'bg-white/20 text-white' : 'bg-vendor-primary/15 text-vendor-primary'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
            {idx < LIFECYCLE_STAGES.length - 1 ? (
              <span className="hidden shrink-0 text-[#ceaef2] sm:inline" aria-hidden>
                →
              </span>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
