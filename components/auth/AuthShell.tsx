'use client';

import React from 'react';
import Link from 'next/link';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-[#001D39]">
      <aside className="hidden w-[42%] flex-col justify-between border-r border-[#0A4174]/40 bg-[#001D39] p-10 lg:flex">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7BBDE8]">
            Nexora Enterprise
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white">
            Hospital Management &amp; Procurement
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#BDD8E9]/80">
            Secure B2B operations for clinical procurement, vendor fulfillment, and
            compliance-grade audit trails.
          </p>
        </div>

        <ul className="space-y-3 text-xs font-semibold text-[#49769F]">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7BBDE8]" />
            15-minute inactivity session guard
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7BBDE8]" />
            UTC activity logging on every auth event
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7BBDE8]" />
            MFA-ready authentication pipeline
          </li>
        </ul>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-[#BDD8E9]/15 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#0A4174]">
              Nexora
            </p>
            <h2 className="mt-1 text-xl font-black text-[#001D39]">Enterprise Access</h2>
          </div>

          <div className="rounded-2xl border border-[#49769F]/25 bg-white p-8 shadow-xl shadow-[#001D39]/10">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-[#001D39]">{title}</h2>
              <p className="mt-2 text-sm font-medium text-[#49769F]">{subtitle}</p>
            </div>

            {children}
          </div>

          {footer && <div className="mt-6 text-center text-xs text-[#49769F]">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function AuthInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="font-mono text-[10px] uppercase tracking-wider text-[#49769F]">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-[#49769F]/30 bg-white px-4 py-3 text-sm font-semibold text-[#001D39] outline-none transition-all placeholder:text-[#49769F]/50 focus:border-[#0A4174] focus:ring-1 focus:ring-[#0A4174]"
      />
    </label>
  );
}

export function AuthButton({
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
      className="w-full rounded-xl bg-[#0A4174] px-4 py-3.5 text-sm font-black text-white shadow-md shadow-[#0A4174]/20 transition-all hover:bg-[#001D39] disabled:cursor-not-allowed disabled:opacity-50"
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
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-[#BDD8E9] bg-[#BDD8E9]/40 text-[#001D39]',
  }[tone];

  return (
    <p className={`rounded-xl border px-4 py-3 text-sm font-semibold ${styles}`} role="alert">
      {message}
    </p>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-[#0A4174] hover:text-[#001D39] hover:underline">
      {children}
    </Link>
  );
}
