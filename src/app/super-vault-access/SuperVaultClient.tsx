'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LogOut, Database, Users, Building, Activity } from 'lucide-react';

export default function SuperVaultClient() {
  const router = useRouter();
  const [session, setSession] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('super_admin_session') || localStorage.getItem('curasync_root_session');
      if (stored) {
        setSession(JSON.parse(stored));
      } else {
        setSession({
          email: 'platform.root@regalhealth.io',
          role: 'SUPER_ADMIN',
        });
      }
    } catch {
      setSession({
        email: 'platform.root@regalhealth.io',
        role: 'SUPER_ADMIN',
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('super_admin_session');
    localStorage.removeItem('curasync_root_session');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    document.cookie = 'super_admin_session=; path=/; max-age=0';
    document.cookie = 'auth-token=; path=/; max-age=0';
    router.push('/superadmin/login/');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-6 sm:p-10">
      <header className="max-w-7xl mx-auto flex items-center justify-between pb-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Super Vault Root Console
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 uppercase font-black">
                Level 0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Active Session: <span className="text-slate-200 font-mono">{session?.email || 'Authenticated'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Portal Home
          </Link>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Terminal</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <Building className="w-8 h-8 text-cyan-400 mb-4" />
          <h2 className="text-base font-bold text-white">Hospital Nodes</h2>
          <p className="text-xs text-slate-400 mt-1">Multi-tenant clinical deployment registries and cluster health.</p>
          <div className="mt-4 text-2xl font-black text-cyan-400">12 Active</div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <Users className="w-8 h-8 text-emerald-400 mb-4" />
          <h2 className="text-base font-bold text-white">Authorized Personnel</h2>
          <p className="text-xs text-slate-400 mt-1">Global doctor credentials, staff RBAC tokens, and MFA logs.</p>
          <div className="mt-4 text-2xl font-black text-emerald-400">148 Nodes</div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <Database className="w-8 h-8 text-amber-400 mb-4" />
          <h2 className="text-base font-bold text-white">Platform Vault</h2>
          <p className="text-xs text-slate-400 mt-1">Encrypted keyrings, token revocation lists, and audit journals.</p>
          <div className="mt-4 text-2xl font-black text-amber-400 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>Encrypted</span>
          </div>
        </div>
      </main>
    </div>
  );
}