'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { purgeLocalAdminSessions } from '@/lib/auth/active-session';
import { setNexoraRoleCookie } from '@/lib/auth/role-cookies';
import { authenticatePortalCredential } from '@/lib/auth/staff-credential-auth';

const SUPER_ADMIN_VAULT_ROUTE = '/super-vault-access';

function PlatformRootConsoleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const postAuthRoute =
    redirectParam && redirectParam !== '/super-admin/dashboard'
      ? redirectParam
      : SUPER_ADMIN_VAULT_ROUTE;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    purgeLocalAdminSessions();
    setReady(true);
  }, []);

  const handleRootAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passcode.trim() || password.trim();

    const result = await authenticatePortalCredential({
      email: cleanEmail,
      passcode: cleanPass,
      scope: 'super_admin',
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      setLoading(false);
      return;
    }

    const rootSession = {
      email: result.user.email,
      role: 'super_admin',
      accessLevel: 'level_0_root',
      authenticatedAt: new Date().toISOString(),
    };

    localStorage.setItem('nexora_superadmin_session', JSON.stringify(rootSession));
    localStorage.setItem('curasync_superadmin_session', JSON.stringify(rootSession));
    setNexoraRoleCookie('super_admin');

    toast.success('Root Master Authentication Verified');
    router.push(postAuthRoute || SUPER_ADMIN_VAULT_ROUTE);
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#f8fafc] p-4 font-sans text-slate-800 select-none sm:p-6">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] opacity-70 [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />

      {/* Top Header */}
      <div className="z-10 mx-auto flex w-full max-w-md items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <span>&larr; Back to Workspace Selector</span>
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
          <ShieldCheck className="h-3 w-3 text-amber-600" />
          <span>Root Isolation Active</span>
        </div>
      </div>

      {/* Main Glass Console Card */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-md space-y-6 rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        {/* Emblem & Title */}
        <div className="space-y-2 text-center">
          <div className="inline-flex rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-3 text-white shadow-lg shadow-amber-500/20">
            <Crown className="h-7 w-7" />
          </div>
          <div>
            <span className="block text-[10px] font-extrabold tracking-widest text-amber-600 uppercase">
              Platform Root Console
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Operations Sign-In</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Restricted infrastructure orchestration access
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleRootAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              Master Email Address
            </label>
            <div className="relative">
              <Mail className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter platform email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              Master Root Passcode
            </label>
            <div className="relative">
              <KeyRound className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passcode || password}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPassword(e.target.value);
                }}
                placeholder="Enter root passcode"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-10 font-mono text-sm font-medium text-slate-900 transition-all focus:border-amber-500 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all duration-150 hover:bg-slate-950 active:scale-[0.99] disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>{loading ? 'Validating Root Credentials...' : 'Enter Root Console'}</span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-400">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>Regal Healthcare Global Infrastructure Node</span>
        </div>
      </div>

      {/* Footer Status */}
      <footer className="z-10 mx-auto w-full max-w-md py-2 text-center text-[11px] text-slate-400">
        Platform Operations &bull; Node 2026-v2.4
      </footer>
    </div>
  );
}

export default function PlatformRootConsole() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      }
    >
      <PlatformRootConsoleForm />
    </Suspense>
  );
}
