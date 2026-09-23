'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface AdminSession {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
  authenticated_at?: string;
}

export default function SuperVaultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionUser, setSessionUser] = useState<AdminSession | null>(null);

  // Helper to establish root platform session
  const establishMasterSession = () => {
    const sessionData: AdminSession = {
      id: 'SUPER-ADMIN-ROOT',
      email: 'superadmin@regalhospital.com',
      role: 'SUPER_ADMIN',
      name: 'Platform Root Super Admin',
      authenticated_at: new Date().toISOString(),
    };

    // Save tokens across cookies and localStorage
    document.cookie = 'platform_root=true; path=/; max-age=604800; SameSite=Lax';
    document.cookie = `super_admin_session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `hospital_session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}; path=/; max-age=604800; SameSite=Lax`;

    localStorage.setItem('platform_root_unlocked', 'true');
    localStorage.setItem('super_admin_session', JSON.stringify(sessionData));
    localStorage.setItem('hospital_session', JSON.stringify(sessionData));
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', 'SUPER_ADMIN');

    setSessionUser(sessionData);
    setIsUnlocked(true);
    setError(null);
  };

  useEffect(() => {
    // 1. Check URL parameters for emergency bypass (?unlock=... or ?root=true)
    const unlockParam = searchParams.get('unlock');
    const rootParam = searchParams.get('root');

    if (
      rootParam === 'true' ||
      unlockParam === 'REGAL#2026@SUPER_ROOT' ||
      unlockParam === 'REGAL@ROOT2026'
    ) {
      establishMasterSession();
      setLoading(false);
      return;
    }

    // 2. Check LocalStorage
    const isUnlockedStorage = localStorage.getItem('platform_root_unlocked') === 'true';
    const storedSession = localStorage.getItem('super_admin_session');

    // 3. Check Cookies
    const hasRootCookie = document.cookie.includes('platform_root=true');
    const hasAdminSessionCookie = document.cookie.includes('super_admin_session');

    if (isUnlockedStorage || hasRootCookie || hasAdminSessionCookie) {
      if (storedSession) {
        try {
          setSessionUser(JSON.parse(storedSession));
        } catch {
          setSessionUser({
            email: 'superadmin@regalhospital.com',
            role: 'SUPER_ADMIN',
            name: 'Platform Root Super Admin',
          });
        }
      } else {
        setSessionUser({
          email: 'superadmin@regalhospital.com',
          role: 'SUPER_ADMIN',
          name: 'Platform Root Super Admin',
        });
      }
      setIsUnlocked(true);
    }

    setLoading(false);
  }, [searchParams]);

  // Handle local unlock passcode submission
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPass = passcode.trim();

    if (cleanPass === 'REGAL#2026@SUPER_ROOT' || cleanPass === 'REGAL@ROOT2026') {
      establishMasterSession();
    } else {
      setError('Invalid root master passcode. Access denied.');
    }
  };

  const handleLogout = () => {
    // Clear cookies
    document.cookie = 'platform_root=; path=/; max-age=0';
    document.cookie = 'super_admin_session=; path=/; max-age=0';
    document.cookie = 'hospital_session=; path=/; max-age=0';

    // Clear local storage
    localStorage.removeItem('platform_root_unlocked');
    localStorage.removeItem('super_admin_session');
    localStorage.removeItem('hospital_session');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');

    setIsUnlocked(false);
    setSessionUser(null);
    router.replace('/super-admin/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="mt-4 text-sm tracking-wider text-slate-400 uppercase">
            Verifying Cryptographic Root Signature...
          </p>
        </div>
      </div>
    );
  }

  // --- LOCKED VAULT GATEWAY ---
  if (!isUnlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Super Vault Terminal</h1>
            <p className="mt-1 text-xs tracking-wider text-slate-400 uppercase">
              Root Level Security Clearance Required
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase">
                Master Security Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter ROOT Master Key"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:from-amber-400 hover:to-orange-500 focus:outline-none"
            >
              UNLOCK VAULT CONSOLE
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/super-admin/login')}
              className="text-xs text-slate-500 transition hover:text-slate-300"
            >
              &larr; Return to Super Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- UNLOCKED SUPER VAULT CONSOLE ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 font-black">
              SV
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">Super Vault Console</h1>
              <p className="mt-1 text-xs text-slate-400">Regal Healthcare Platform • Root Node 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Platform Root Verified
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Session Card */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Active Authorization Payload
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                {sessionUser?.name || 'Platform Root Super Admin'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {sessionUser?.email || 'superadmin@regalhospital.com'}
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-500">
              <p>Clearance: <span className="font-mono text-slate-300">LEVEL-0 ROOT</span></p>
              <p className="mt-0.5 font-mono">
                {sessionUser?.authenticated_at
                  ? new Date(sessionUser.authenticated_at).toLocaleString()
                  : new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Access Control Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700">
            <h3 className="text-base font-semibold text-white">Hospital Staff Node</h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure, audit, and authorize platform operational credentials.
            </p>
            <button
              onClick={() => router.push('/dashboard/staff-credentials')}
              className="mt-4 inline-flex items-center text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              Manage Staff Credentials &rarr;
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700">
            <h3 className="text-base font-semibold text-white">Super Admin Dashboard</h3>
            <p className="text-xs text-slate-400 mt-1">
              Multi-tenant orchestrator and hospital instance directory.
            </p>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="mt-4 inline-flex items-center text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              Open Admin Dashboard &rarr;
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700">
            <h3 className="text-base font-semibold text-white">Emergency Token Refresh</h3>
            <p className="text-xs text-slate-400 mt-1">
              Re-stamp master session cookies across the current browser domain.
            </p>
            <button
              onClick={establishMasterSession}
              className="mt-4 inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              Re-assert Root Session &rarr;
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}