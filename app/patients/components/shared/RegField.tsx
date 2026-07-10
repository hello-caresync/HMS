import type { ReactNode } from 'react';

type FieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function RegField({ label, htmlFor, required, hint, error, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-800">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[10px] font-medium text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-[10px] text-slate-800">{hint}</p>}
    </div>
  );
}

export const inputCls = (error?: boolean) =>
  `w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-800 focus:outline-none focus:ring-2 ${
    error
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
      : 'border-slate-200 focus:border-primary focus:ring-primary/20'
  }`;

export const selectCls = (error?: boolean) =>
  `w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
    error
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
      : 'border-slate-200 focus:border-primary focus:ring-primary/20'
  }`;
