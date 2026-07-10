'use client';

import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

import { useIPD } from '../context/IPDProvider';

export default function IPDToastStack() {
  const { toasts, dismissToast } = useIPD();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
      {toasts.map((t) => {
        const styles =
          t.type === 'alert'
            ? 'border-amber-300 bg-amber-950 text-amber-50'
            : t.type === 'success'
              ? 'border-emerald-300 bg-emerald-950 text-emerald-50'
              : 'border-sky-300 bg-slate-900 text-slate-100';
        const Icon =
          t.type === 'alert' ? AlertTriangle : t.type === 'success' ? CheckCircle2 : Info;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-sm gap-2 rounded-lg border px-3 py-2 shadow-xl ${styles}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-xs font-medium">{t.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
