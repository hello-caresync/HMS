import type { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { hospitalStatusColors, hospitalUi } from '@/lib/nexora-hospital/design-tokens';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ui = hospitalUi;
export const statusColors = hospitalStatusColors;

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#B2EBF2] bg-[#FAFDFF] px-6 py-16 text-center">
      <p className="text-xl font-bold text-[#0A2E36]">{title}</p>
      {description && <p className="mt-2 text-base font-medium text-[#005F6B]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className={cn(ui.cardMetric)}>
      <p className="text-sm font-bold uppercase tracking-wider text-[#005F6B]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#0A2E36]">{value}</p>
      {subtext && <p className="mt-1 text-sm font-medium text-[#007B8A]">{subtext}</p>}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close modal" />
      <div
        className={cn(
          'relative z-10 w-full rounded-2xl border border-[#B2EBF2] bg-white p-6 shadow-xl',
          maxWidth,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0A2E36]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-[#005F6B] hover:text-[#0A2E36]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  return (
    <span className={cn(ui.badge, statusColors[status] ?? 'bg-[#E0F7FA] text-[#0A2E36]')}>{status}</span>
  );
}

export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-base font-medium text-[#005F6B]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#007B8A] border-t-transparent" />
      {label}
    </div>
  );
}
