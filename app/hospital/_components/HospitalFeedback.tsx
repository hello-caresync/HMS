'use client';

import { useCallback, useState } from 'react';

export type HospitalToast = { type: 'success' | 'error' | 'info'; message: string } | null;

export function useHospitalToast() {
  const [toast, setToast] = useState<HospitalToast>(null);

  const showToast = useCallback((type: NonNullable<HospitalToast>['type'], message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const showSuccess = useCallback((message: string) => showToast('success', message), [showToast]);
  const showError = useCallback((message: string) => showToast('error', message), [showToast]);
  const showInfo = useCallback((message: string) => showToast('info', message), [showToast]);

  return { toast, showSuccess, showError, showInfo, clearToast: () => setToast(null) };
}

export function HospitalToastBanner({ toast }: { toast: HospitalToast }) {
  if (!toast) return null;

  const styles =
    toast.type === 'success'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
      : toast.type === 'error'
        ? 'border-rose-300 bg-rose-50 text-rose-900'
        : 'border-sky-300 bg-sky-50 text-sky-900';

  return (
    <div role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${styles}`}>
      {toast.message}
    </div>
  );
}
