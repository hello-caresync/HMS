'use client';

import React, { useState } from 'react';

export default function SuperAdminGatewayPage() {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passcode.trim();

    // Valid master credentials
    const isMasterUser =
      cleanEmail === 'platform.root@regalhealth.io' ||
      cleanEmail === 'superadmin@regalhospital.com';

    const isMasterPass =
      cleanPass === 'CURA#2026@ROOT_VAULT' ||
      cleanPass === 'REGAL#2026@SUPER_ROOT' ||
      cleanPass === 'REGAL@ROOT2026';

    if (isMasterUser && isMasterPass) {
      const sessionPayload = {
        id: 'SUPER-ADMIN-ROOT',
        email: cleanEmail,
        role: 'SUPER_ADMIN',
        name: 'Platform Root Super Admin',
        authenticated_at: new Date().toISOString(),
      };

      // Set cookies for root access
      document.cookie = 'platform_root=true; path=/; max-age=604800; SameSite=Lax';
      document.cookie = `super_admin_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `hospital_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=604800; SameSite=Lax`;

      // Set localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('platform_root_unlocked', 'true');
        localStorage.setItem('super_admin_session', JSON.stringify(sessionPayload));
        localStorage.setItem('hospital_session', JSON.stringify(sessionPayload));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', 'SUPER_ADMIN');
      }

      // Hard redirect to the vault page with trailing slash
      window.location.href = '/super-vault-access/';
      return;
    }

    setError('Invalid email or passcode.');
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
            Multi-tenant isolation & hospital node orchestration
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Platform Master Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="platform.root@regalhealth.io"
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
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 hover:from-amber-400 hover:to-orange-500"
          >
            ENTER ROOT CONSOLE &rarr;
          </button>
        </form>
      </div>
    </div>
  );
}