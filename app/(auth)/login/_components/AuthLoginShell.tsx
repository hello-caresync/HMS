'use client';

import React from 'react';
import { Building2, ShieldCheck } from 'lucide-react';

type AuthLoginShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthLoginShell({ title, subtitle, children }: AuthLoginShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-10 lg:flex">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute left-0 top-24 h-64 w-64 rounded-full bg-sky-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-indigo-500 blur-3xl" />
        </div>

        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Building2 className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-200/80">
                Nexora Health Systems
              </p>
              <p className="text-sm font-bold text-white">Hospital ERP · Phase 1</p>
            </div>
          </div>

          <div>
            <h1 className="max-w-sm text-3xl font-black leading-tight tracking-tight text-white">
              Enterprise Identity Gateway
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-200">
              Authorized internal staff only. All authentication events are audited and
              session-bound to trusted hospital infrastructure.
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs font-medium text-slate-200">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          ISO-aligned session controls · MFA-ready · 15-min idle guard
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-200">
              Nexora Hospital ERP
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
            <header className="mb-6 space-y-1">
              <h2 className="text-xl font-black tracking-tight text-slate-900">{title}</h2>
              <p className="text-sm text-slate-200">{subtitle}</p>
            </header>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-200">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-200 focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

export function AuthPrimaryButton({
  children,
  loading,
  disabled,
  type = 'submit',
  onClick,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Processing…' : children}
    </button>
  );
}

export function AuthAlert({
  tone,
  message,
}: {
  tone: 'error' | 'success' | 'info';
  message: string;
}) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
  }[tone];

  return (
    <p className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`} role="alert">
      {message}
    </p>
  );
}
