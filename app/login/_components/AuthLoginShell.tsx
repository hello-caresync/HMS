'use client';

import { Building2, ShieldCheck, Stethoscope } from 'lucide-react';

type AuthLoginShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthLoginShell({ title, subtitle, children }: AuthLoginShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 p-10 lg:flex">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute left-0 top-24 h-64 w-64 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-emerald-500 blur-3xl" />
        </div>

        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Stethoscope className="h-5 w-5 text-teal-200" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-teal-200/80">
                Nexora Clinical
              </p>
              <p className="text-sm font-bold text-white">Standalone Doctor Application</p>
            </div>
          </div>

          <div>
            <h1 className="max-w-sm text-3xl font-extrabold leading-tight tracking-tight text-white">
              Secure Clinical Gateway
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-teal-100/90">
              Authorized clinical staff only. Sandbox session controls for local development.
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs font-medium text-teal-100">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Session-bound · MFA-ready · idle guard active
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <Building2 className="h-5 w-5 text-teal-800" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-wider text-teal-950">
              Nexora Clinical
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <header className="mb-6 space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
              <p className="text-base font-medium text-slate-600">{subtitle}</p>
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
      <span className="text-base font-medium text-slate-800">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
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
      className="w-full rounded-xl bg-teal-950 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Processing…
        </span>
      ) : (
        children
      )}
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
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    info: 'border-teal-200 bg-teal-50 text-teal-950',
  }[tone];

  return (
    <p className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`} role="alert">
      {message}
    </p>
  );
}
