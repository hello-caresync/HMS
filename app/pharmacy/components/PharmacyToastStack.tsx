'use client';

import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

import { usePharmacy } from '../context/PharmacyProvider';
import type { PharmacyToast } from '../types';

function ToastCard({ toast, onDismiss }: { toast: PharmacyToast; onDismiss: () => void }) {
  const styles =
    toast.type === 'alert'
      ? 'border-rose-300 bg-rose-950 text-rose-50 shadow-rose-900/40'
      : toast.type === 'success'
        ? 'border-emerald-300 bg-emerald-950 text-emerald-50 shadow-emerald-900/40'
        : 'border-sky-300 bg-slate-900 text-slate-100 shadow-slate-900/40';

  const Icon =
    toast.type === 'alert' ? AlertTriangle : toast.type === 'success' ? CheckCircle2 : Info;

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-md gap-3 rounded-lg border px-3 py-2.5 shadow-xl animate-fadeIn ${styles}`}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function PharmacyToastStack() {
  const { toasts, dismissToast } = usePharmacy();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
