'use client';

import React, { useState } from 'react';

import { verifySuperAdminVaultCredentials } from '@/lib/auth/super-admin-auth';
import { recordOrQueueRootLoginSuccess } from '@/lib/auth/super-admin-login-audit';
import {
  completeRootSuperAdminGatewayLogin,
  isRootMasterCredentials,
  markSuperAdminGatewayComplete,
  persistDelegatedSuperAdminSession,
  persistRootMasterSuperAdminGatewaySession,
  redirectToSuperAdminVault,
  SUPER_ADMIN_INVALID_CREDENTIALS_MESSAGE,
  SUPER_ADMIN_ROOT_EMAIL,
} from '@/lib/auth/superAdminAuth';
import { supabase } from '@/lib/supabase/client';

function finalizeDelegatedSuperAdminSession(staff: Record<string, unknown>): void {
  persistDelegatedSuperAdminSession(staff);
  if (typeof window !== 'undefined') {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', 'SUPER_ADMIN');
  }
}

export default function SuperAdminGatewayPage() {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const authenticateDelegated = async (cleanEmail: string, cleanPasscode: string) => {
    setLoading(true);

    try {
      const vaultVerified = await verifySuperAdminVaultCredentials(cleanEmail, cleanPasscode);
      if (vaultVerified) {
        persistRootMasterSuperAdminGatewaySession(cleanEmail);
        markSuperAdminGatewayComplete();
        redirectToSuperAdminVault();
        return;
      }

      if (supabase) {
        const { data: staff, error: staffError } = await supabase
          .from('hospital_staff')
          .select('*')
          .ilike('email', cleanEmail)
          .eq('passcode_key', cleanPasscode)
          .or('role.ilike.%super%,role.ilike.%admin%')
          .eq('is_active', true)
          .maybeSingle();

        if (!staffError && staff) {
          finalizeDelegatedSuperAdminSession(staff as Record<string, unknown>);
          markSuperAdminGatewayComplete();
          redirectToSuperAdminVault();
          return;
        }
      }
    } catch {
      setError('Unable to reach the authentication service.');
      setLoading(false);
      return;
    }

    setError(SUPER_ADMIN_INVALID_CREDENTIALS_MESSAGE);
    setLoading(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPasscode = (passcode || '').trim();

    // Root master bypass — client-side only; no /api/admin/auth/login (Cloudflare 405 safe).
    if (isRootMasterCredentials(cleanEmail, cleanPasscode)) {
      setLoading(true);
      void recordOrQueueRootLoginSuccess();
      completeRootSuperAdminGatewayLogin(SUPER_ADMIN_ROOT_EMAIL);
      return;
    }

    await authenticateDelegated(cleanEmail, cleanPasscode);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-500">
            Global Platform Security
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white">Super Admin Gateway</h1>
          <p className="mt-1 text-xs text-slate-400">
            Multi-tenant isolation &amp; hospital node orchestration
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {error}
          </div>
        ) : null}

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Platform Master Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={SUPER_ADMIN_ROOT_EMAIL}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Root Security Passcode
            </label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter root passcode"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 hover:from-amber-400 hover:to-orange-500 disabled:opacity-60"
          >
            {loading ? 'Authenticating…' : 'ENTER ROOT CONSOLE →'}
          </button>
        </form>
      </div>
    </div>
  );
}
