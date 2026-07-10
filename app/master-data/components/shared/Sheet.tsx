'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type SheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  width?: 'md' | 'lg' | 'xl';
};

const WIDTH: Record<NonNullable<SheetProps['width']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Sheet({
  open,
  title,
  description,
  onClose,
  children,
  width = 'lg',
}: SheetProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full ${WIDTH[width]} flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-800">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-800 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </>
  );
}
