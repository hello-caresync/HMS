'use client';

export const dynamic = 'force-static';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
import {
  LOGIN_FORM_AUTOCOMPLETE,
  LOGIN_IDENTIFIER_INPUT_PROPS,
  LOGIN_PASSWORD_INPUT_PROPS,
} from '@/lib/auth/login-form-security';
import {
  hardNavigateSuperAdminRoute,
  isRootMasterCredentials,
  SUPER_ADMIN_DEFAULT_PORTAL,
} from '@/lib/auth/superAdminAuth';

const ROOT_HARDWARE_TOKEN = 'NXR-1001';

function SuperAdminLoginContent() {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [tokenKey, setTokenKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRootLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPasscode = passcode.trim();
    const cleanToken = tokenKey.trim().toUpperCase();

    if (!isRootMasterCredentials(cleanEmail, cleanPasscode) || (cleanToken && cleanToken !== ROOT_HARDWARE_TOKEN)) {
      setError('Access Denied: Invalid Regal Root Identifier, Passkey, or Token.');
      setLoading(false);
      return;
    }

    const superAdminSession = {
      role: 'SUPER_ADMIN',
      email: cleanEmail,
      name: 'Platform Root Super Admin',
      accessLevel: 'ROOT_LEVEL_0',
      token: `root_vault_${Date.now()}`,
      hardwareToken: cleanToken || ROOT_HARDWARE_TOKEN,
      authenticatedAt: new Date().toISOString(),
    };

    localStorage.setItem('super_admin_session', JSON.stringify(superAdminSession));
    localStorage.setItem('curasync_root_session', JSON.stringify(superAdminSession));
    localStorage.setItem('userRole', 'SUPER_ADMIN');
    localStorage.setItem('isAuthenticated', 'true');

    document.cookie = `super_admin_session=active; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `auth-token=${superAdminSession.token}; path=/; max-age=604800; SameSite=Lax`;

    hardNavigateSuperAdminRoute(SUPER_ADMIN_DEFAULT_PORTAL);
  };

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden font-sans text-slate-100">
      <AuthSceneBackground tone="vault" />

      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 py-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 self-start text-xs font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Regal HMS Gateway
        </Link>

        <div className="my-auto overflow-hidden rounded-2xl border border-violet-500/25 bg-[#12141f]/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-400" />

          <div className="p-6 sm:p-8">
            <div className="mb-7 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">Regal Platform Vault</h1>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  Classified Root Access · Level 0
                </p>
              </div>
            </div>

            {error ? (
              <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-300">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleRootLogin} autoComplete={LOGIN_FORM_AUTOCOMPLETE} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-300">
                  Master Identifier
                </label>
                <input
                  type="email"
                  required
                  name="superadmin-identifier"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full rounded-xl border border-slate-700/80 bg-[#0c0e16] px-3.5 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  {...LOGIN_IDENTIFIER_INPUT_PROPS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-300">
                  Master Passkey
                </label>
                <input
                  type="password"
                  required
                  name="superadmin-passkey"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter your passcode"
                  className="w-full rounded-xl border border-slate-700/80 bg-[#0c0e16] px-3.5 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  {...LOGIN_PASSWORD_INPUT_PROPS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-300">
                  Hardware Token Key
                </label>
                <input
                  type="text"
                  name="superadmin-token"
                  value={tokenKey}
                  onChange={(e) => setTokenKey(e.target.value)}
                  autoComplete="off"
                  placeholder="e.g. Hardware token"
                  className="w-full rounded-xl border border-slate-700/80 bg-[#0c0e16] px-3.5 py-3 text-sm text-slate-100 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-violet-600 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-500 disabled:opacity-70"
              >
                {loading ? 'Authenticating…' : 'Authenticate Super Admin'}
              </button>
            </form>

            <p className="mt-6 text-center text-[10px] font-medium tracking-wide text-slate-500">
              Regal Hospital Management System Security Protocol 2026.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative isolate flex min-h-dvh items-center justify-center text-xs font-semibold uppercase tracking-wider text-slate-400">
          <AuthSceneBackground tone="vault" />
          Loading Super Admin Terminal...
        </div>
      }
    >
      <SuperAdminLoginContent />
    </Suspense>
  );
}
