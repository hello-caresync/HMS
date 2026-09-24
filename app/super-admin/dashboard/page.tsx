'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Crown, Hospital, Users } from 'lucide-react';

import { clearHospitalOsSessionTokens } from '@/lib/auth/active-session';
import { SUPER_ADMIN_VAULT_LOGIN_REDIRECT } from '@/lib/auth/superAdminAuth';
import { fetchHospitalStaffCounts, type HospitalStaffRoleCount } from '@/lib/hospital/hospital-staff-roster';
import { supabase } from '@/lib/supabaseClient';

const HOSPITAL_ADMIN_LOGIN = '/hospital/login';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [tenantStats, setTenantStats] = useState<HospitalStaffRoleCount>({
    accounts: 45,
    doctors: 41,
    staff: 3,
    admins: 1,
  });

  useEffect(() => {
    window.location.replace(SUPER_ADMIN_VAULT_LOGIN_REDIRECT);
  }, []);

  useEffect(() => {
    void fetchHospitalStaffCounts(supabase).then(setTenantStats);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-100 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-amber-300 uppercase">
            <Crown className="h-3.5 w-3.5" />
            Level-0 Super Admin Console
          </div>
          <h1 className="mt-4 text-3xl font-black">Platform Operations Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Provision hospital nodes, create initial Hospital Admin credentials, and manage the
            multi-tenant clinical ecosystem.
          </p>
        </div>

        <div
          role="link"
          tabIndex={0}
          onClick={() => {
            clearHospitalOsSessionTokens();
            router.push(HOSPITAL_ADMIN_LOGIN);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            clearHospitalOsSessionTokens();
            router.push(HOSPITAL_ADMIN_LOGIN);
          }}
          className="w-full cursor-pointer text-left p-6 bg-white border border-purple-200 rounded-3xl shadow-sm text-slate-900 hover:border-purple-400 hover:shadow-md transition"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-purple-100 text-purple-800">
              HOSP-01
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-purple-950">Regal Hospital</h3>
          <p className="text-xs text-gray-500 mb-6">Bengaluru, Karnataka</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="text-2xl font-black text-gray-900">{tenantStats.accounts}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Accounts</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <div className="text-2xl font-black text-blue-600">{tenantStats.doctors}</div>
              <div className="text-[10px] font-bold text-blue-500 uppercase mt-0.5">Doctors</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="text-2xl font-black text-emerald-600">{tenantStats.staff}</div>
              <div className="text-[10px] font-bold text-emerald-500 uppercase mt-0.5">Staff</div>
            </div>
          </div>
          <Link
            href={HOSPITAL_ADMIN_LOGIN}
            onClick={(event) => {
              event.stopPropagation();
              clearHospitalOsSessionTokens();
            }}
            className="mt-5 inline-block text-[11px] font-bold text-purple-700 hover:underline"
          >
            View Hospital Vault
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push('/super-admin/staff-credentials')}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-left transition hover:border-teal-500/40"
          >
            <Hospital className="mb-3 h-8 w-8 text-teal-400" />
            <h2 className="text-lg font-bold">Hospital Provisioning</h2>
            <p className="mt-1 text-xs text-slate-400">
              Onboard hospitals and generate initial Hospital Admin login credentials.
            </p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/super-admin/staff-credentials')}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-left transition hover:border-indigo-500/40"
          >
            <Users className="mb-3 h-8 w-8 text-indigo-400" />
            <h2 className="text-lg font-bold">Credential Registry</h2>
            <p className="mt-1 text-xs text-slate-400">
              View and manage all provisioned hospital admin and staff credential blocks.
            </p>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Building2 className="h-4 w-4" />
          Regal Platform Root • Secured Operations Layer
        </div>
      </div>
    </div>
  );
}
