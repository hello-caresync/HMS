'use client';

import { Zap } from 'lucide-react';

import { isBillingPendingEncounterStatus } from '@/lib/notifications/opd-alerts';

type OutpatientStatusCellProps = {
  status: string;
  onSettleBill?: () => void;
};

function normalizeStatus(status: string): string {
  return String(status ?? '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ');
}

function isCompletedStatus(status: string): boolean {
  const value = status.toLowerCase();
  return /complete|paid|discharged|closed/.test(value) && !isBillingPendingEncounterStatus(status);
}

function isWaitingStatus(status: string): boolean {
  const value = status.toLowerCase();
  return /wait|book|pending|scheduled|confirmed|issued|triage/.test(value) && !isBillingPendingEncounterStatus(status);
}

export function OutpatientStatusCell({ status, onSettleBill }: OutpatientStatusCellProps) {
  if (isBillingPendingEncounterStatus(status)) {
    return (
      <button
        type="button"
        onClick={onSettleBill}
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-200 animate-pulse"
      >
        <Zap className="h-3.5 w-3.5" />
        <span>₹</span>
        <span>Settle Bill &amp; Receipt</span>
      </button>
    );
  }

  if (isCompletedStatus(status)) {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        Paid &amp; Discharged
      </span>
    );
  }

  if (isWaitingStatus(status)) {
    return (
      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        In Triage / Waiting
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
      {normalizeStatus(status)}
    </span>
  );
}
