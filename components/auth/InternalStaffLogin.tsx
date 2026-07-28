'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Fingerprint,
  Lock,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { AuthAlert, AuthButton, AuthInput } from './AuthShell';
import { APP_ROUTES } from '@/app/lib/routes';
import {
  signInWithBiometricBypass,
  signInWithEmail,
  type HospitalStaffProfile,
} from '@/app/lib/auth';

type InternalStaffLoginProps = {
  bannerMessage?: string | null;
  onAuthenticated: (session: HospitalStaffProfile) => void;
};

export default function InternalStaffLogin({
  bannerMessage,
  onAuthenticated,
}: InternalStaffLoginProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricPulse, setBiometricPulse] = useState(false);

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await signInWithEmail(identifier, password);
    setLoading(false);

    if (result.ok === false) {
      setError(result.error);
      return;
    }

    onAuthenticated(result.session);
  };

  const handleBiometricBypass = async () => {
    setBiometricLoading(true);
    setError('');
    setBiometricPulse(true);

    await new Promise((resolve) => window.setTimeout(resolve, 900));

    const employeeHint = identifier.trim().toUpperCase().startsWith('EMP-')
      ? identifier.trim()
      : undefined;

    const result = await signInWithBiometricBypass(employeeHint);
    setBiometricLoading(false);
    setBiometricPulse(false);

    if (result.ok === false) {
      setError(result.error);
      return;
    }

    onAuthenticated(result.session);
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden border-r border-slate-700/50 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0c4a6e] p-10 lg:flex">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-sky-400 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-56 w-56 rounded-full bg-indigo-500 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/30">
              <Building2 className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-sky-300/80">
                Nexora Health Systems
              </p>
              <p className="text-sm font-bold text-white">Back-Office ERP</p>
            </div>
          </div>

          <h1 className="mt-10 max-w-md text-3xl font-black leading-tight tracking-tight text-white">
            Internal Staff Access Gateway
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-200/90">
            Authorized hospital personnel only. Clinical partners, patients, and external
            vendors authenticate through separate portals.
          </p>
        </div>

        <ul className="relative space-y-3 text-xs font-medium text-slate-200">
          <li className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            RBAC-enforced module routing per staff role
          </li>
          <li className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 shrink-0 text-sky-400" />
            15-minute inactivity session termination
          </li>
          <li className="flex items-center gap-2.5">
            <Fingerprint className="h-4 w-4 shrink-0 text-indigo-400" />
            Smart-card / biometric bypass for on-duty terminals
          </li>
        </ul>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-[#f8fafc] px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-200">
              Nexora Back-Office ERP
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Staff Sign-In</h2>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <UserRound className="h-5 w-5 text-slate-800" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Corporate Identity Verification
                </h2>
                <p className="mt-1 text-sm text-slate-200">
                  Enter your employee credentials to access assigned ERP modules.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {bannerMessage && <AuthAlert tone="info" message={bannerMessage} />}
              {error && <AuthAlert tone="error" message={error} />}

              <AuthInput
                id="staff-identifier"
                label="Corporate Employee ID / Email"
                type="text"
                value={identifier}
                onChange={setIdentifier}
                placeholder="EMP-3012 or nurse.icu@nexora.health"
                autoComplete="username"
              />

              <AuthInput
                id="staff-password"
                label="Security Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••••"
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between text-xs">
                <Link
                  href={APP_ROUTES.loginForgotPassword}
                  className="font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                >
                  Reset credentials
                </Link>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-200">
                  Secured channel
                </span>
              </div>

              <AuthButton loading={loading}>Authenticate &amp; Enter ERP</AuthButton>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                  On-duty bypass
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBiometricBypass}
              disabled={biometricLoading}
              className={`group flex w-full items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-3.5 text-sm font-semibold transition-all ${
                biometricPulse
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-slate-50 text-slate-800 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-900'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Fingerprint
                className={`h-5 w-5 ${biometricPulse ? 'animate-pulse text-emerald-600' : 'text-slate-200 group-hover:text-sky-600'}`}
              />
              {biometricLoading
                ? 'Scanning smart-card…'
                : 'Biometric / Smart-Card Authentication Bypass'}
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-200">
              Simulation: defaults to EMP-3012 (ICU Nurse) when no employee ID is entered.
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-200">
            Protected health-information environment. Unauthorized access is monitored and
            logged under hospital IAM policy.
          </p>
        </div>
      </main>
    </div>
  );
}
