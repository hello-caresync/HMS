'use client';

import { CheckCircle2, X } from 'lucide-react';

import { useReports } from '../context/ReportsProvider';

export default function ReportsToastStack() {
  const { toasts, dismissToast } = useReports();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex max-w-md gap-2 rounded-lg border border-emerald-400 bg-emerald-950 px-3 py-2.5 text-emerald-50 shadow-xl animate-fadeIn"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="flex-1 text-xs font-medium leading-relaxed">{t.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="shrink-0 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
