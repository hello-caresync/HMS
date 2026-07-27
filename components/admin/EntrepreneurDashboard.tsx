'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Activity,
  Building2,
  Loader2,
  LogOut,
  Stethoscope,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_SESSION_KEY = 'nexora_admin_session';

type AdminSession = {
  adminId: string;
  email: string;
  fullName: string;
  role: string;
  accessToken: string;
};

type DashboardData = {
  kpis: {
    doctors: number;
    patients: number;
    appointmentsToday: number;
    activeAdmissions: number;
    pendingLabs: number;
    systemHealth: string;
  };
  hospitals: { id: string; name: string; code: string }[];
  doctors: {
    id: string;
    fullName: string;
    email: string;
    specialization: string;
    role: string;
    appointmentCount: number;
    prescriptionCount: number;
    patientAssignments: number;
  }[];
  recentActivity: { id: string; action: string; entityType: string; at: string }[];
};

function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export default function EntrepreneurDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState('admin@nexora.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  useEffect(() => {
    if (!session) return;
    setFetching(true);
    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDashboard(d.dashboard);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setFetching(false));
  }, [session]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Login failed');
      const adminSession: AdminSession = {
        ...data.user,
        accessToken: data.accessToken,
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
      setSession(adminSession);
      toast.success(`Welcome, ${adminSession.fullName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setSession(null);
    setDashboard(null);
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF5] px-4">
        <form onSubmit={login} className="w-full max-w-md rounded-2xl border border-[#E6E3C5] bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <Building2 className="mx-auto mb-2 h-10 w-10 text-[#A39E75]" />
            <h1 className="text-xl font-bold text-[#2B2A22]">Entrepreneur Console</h1>
            <p className="text-sm text-[#5A584A]">System-level management for Nexora Doctor platform</p>
          </div>
          <input
            className="mb-3 w-full rounded-lg border border-[#E6E3C5] px-3 py-2 text-sm"
            placeholder="admin@nexora.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="mb-4 w-full rounded-lg border border-[#E6E3C5] px-3 py-2 text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2B2A22] py-2.5 text-sm font-semibold text-[#FAFAF5] disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="mt-4 text-center text-xs text-[#5A584A]">
            Demo: admin@nexora.com / admin123
          </p>
          <Link href="/doctor/dashboard" className="mt-4 block text-center text-xs text-[#A39E75] hover:underline">
            ← Doctor portal
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5] text-[#2B2A22]">
      <header className="border-b border-[#E6E3C5] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A39E75]">Nexora Platform</p>
            <h1 className="text-lg font-bold">Entrepreneur & Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#5A584A]">{session.fullName}</span>
            <Link href="/doctor/dashboard" className="text-sm text-[#A39E75] hover:underline">
              Doctor app
            </Link>
            <button type="button" onClick={signOut} className="flex items-center gap-1 text-sm text-[#5A584A] hover:text-[#2B2A22]">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {fetching || !dashboard ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#A39E75]" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Doctors', value: dashboard.kpis.doctors, icon: Stethoscope },
                { label: 'Patients', value: dashboard.kpis.patients, icon: Users },
                { label: 'Appointments today', value: dashboard.kpis.appointmentsToday, icon: Activity },
                { label: 'Active IPD', value: dashboard.kpis.activeAdmissions, icon: Building2 },
                { label: 'Pending labs', value: dashboard.kpis.pendingLabs, icon: Activity },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-[#E6E3C5] bg-white p-4 shadow-sm">
                  <Icon className="mb-2 h-5 w-5 text-[#A39E75]" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-[#5A584A]">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#E6E3C5] bg-white p-5">
                <h2 className="mb-4 font-bold">Doctor roster</h2>
                <div className="space-y-2">
                  {dashboard.doctors.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-xl bg-[#FAFAF5] px-3 py-2 text-sm">
                      <div>
                        <p className="font-semibold">{d.fullName}</p>
                        <p className="text-xs text-[#5A584A]">{d.specialization}</p>
                      </div>
                      <div className="text-right text-xs text-[#5A584A]">
                        <p>{d.appointmentCount} appts</p>
                        <p>{d.patientAssignments} patients</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6E3C5] bg-white p-5">
                <h2 className="mb-4 font-bold">Recent system activity</h2>
                <ul className="space-y-2 text-sm">
                  {dashboard.recentActivity.map((a) => (
                    <li key={a.id} className="rounded-lg border border-[#E6E3C5]/60 px-3 py-2">
                      <span className="font-medium">{a.action}</span>
                      <span className="text-[#5A584A]"> · {a.entityType}</span>
                      <p className="text-xs text-[#5A584A]">{new Date(a.at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <p className="mt-6 text-center text-xs text-[#5A584A]">
              System health: <strong className="text-green-700">{dashboard.kpis.systemHealth}</strong>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
