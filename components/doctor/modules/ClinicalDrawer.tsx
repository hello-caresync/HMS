'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

import { clinicalClasses } from '@/lib/doctor/theme';

export function ClinicalDrawer({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/30" aria-label="Close drawer" onClick={onClose} />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-brand-light bg-brand-surface shadow-xl ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-brand-light/60 bg-brand-text px-4 py-3 text-brand-surface">
          <h2 className="text-sm font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-brand-surface/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}

export function ClinicalModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className={`relative ${clinicalClasses.card} max-h-[90vh] w-full max-w-lg overflow-y-auto p-6`}>
        <h3 className="text-lg font-bold text-brand-text">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
