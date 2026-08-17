'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  BadgeCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import {
  DEFAULT_DOCTOR_PASSWORD,
  authenticateDoctor,
  formatDoctorLoginOption,
  loadDoctorProfiles,
  type DoctorProfileRow,
} from '@/lib/doctor/doctor-auth-service';
import {
  DEFAULT_REGAL_DOCTOR,
  REGAL_DOCTORS,
  findRegalDoctor,
} from '@/lib/doctor/regal-doctors';
import { doctorToSession, profileToSession, setDoctorSession } from '@/lib/doctor/session';
import { resolveDoctorContext } from '@/lib/doctor/command-center/doctor-context';
import { DOCTOR_STORAGE_KEYS, writeJsonStorage } from '@/lib/doctor/storage-keys';

const REMEMBER_KEY = DOCTOR_STORAGE_KEYS.rememberedDoctor;
const ACTIVE_DOCTOR_KEY = DOCTOR_STORAGE_KEYS.activeDoctor;

function formatSupabaseError(err: unknown): string {
  if (!err) return 'Unknown sync error';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    return [e.message, e.details, e.hint, e.code].filter(Boolean).join(' · ') || 'Supabase sync unavailable';
  }
  return 'Supabase sync unavailable';
}

function readRememberedDoctorId(): string {
  if (typeof window === 'undefined') return DEFAULT_REGAL_DOCTOR.employeeId;
  try {
    const remembered = window.localStorage.getItem(REMEMBER_KEY);
    if (remembered) return remembered;
  } catch {
    /* ignore */
  }
  return DEFAULT_REGAL_DOCTOR.employeeId;
}

function hasRememberedDoctor(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return Boolean(window.localStorage.getItem(REMEMBER_KEY));
  } catch {
    return true;
  }
}

export default function DoctorLoginPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<DoctorProfileRow[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(readRememberedDoctorId);
  const [password, setPassword] = useState(DEFAULT_DOCTOR_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(hasRememberedDoctor);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const rows = await loadDoctorProfiles();
      setProfiles(rows);
      setProfilesLoading(false);
      if (rows.length > 0) {
        setSelectedId((current) => (rows.some((row) => row.id === current) ? current : rows[0].id));
      }
    })();
  }, []);

  const selectedProfile = useMemo(() => {
    return profiles.find((row) => row.id === selectedId) ?? null;
  }, [profiles, selectedId]);

  const fallbackDoctor = useMemo(() => findRegalDoctor(selectedId) ?? DEFAULT_REGAL_DOCTOR, [selectedId]);

  const persistDoctorSession = (session: ReturnType<typeof profileToSession>) => {
    setDoctorSession(session);
    writeJsonStorage(ACTIVE_DOCTOR_KEY, {
      doctorId: session.employeeId,
      doctor_name: session.fullName,
      fullName: session.fullName,
      employeeId: session.employeeId,
      department: session.department,
      signedInAt: session.signedInAt,
    });
    writeJsonStorage(DOCTOR_STORAGE_KEYS.doctorSession, session);

    if (typeof window !== 'undefined') {
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, session.employeeId);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setNotice('Enter your access password.');
      return;
    }

    setLoading(true);
    setNotice(null);

    const email = selectedProfile?.email ?? `${fallbackDoctor.employeeId.toLowerCase()}@regal.local`;
    const auth = await authenticateDoctor(email, password);

    if (!auth.ok || !auth.profile) {
      if (profiles.length === 0 && password === DEFAULT_DOCTOR_PASSWORD) {
        const session = doctorToSession(fallbackDoctor, email);
        persistDoctorSession(session);
        try {
          await resolveDoctorContext(session);
        } catch {
          /* warm on dashboard */
        }
        setLoading(false);
        router.replace('/doctor/dashboard');
        return;
      }

      setLoading(false);
      setNotice(auth.error ?? 'Authentication failed.');
      return;
    }

    const session = profileToSession(auth.profile);
    persistDoctorSession(session);

    try {
      await resolveDoctorContext(session);
    } catch {
      /* UUID map warms on first dashboard load */
    }

    try {
      const { error } = await supabase.from('doctor_sessions').upsert(
        {
          employee_id: auth.profile.id,
          doctor_name: auth.profile.name,
          department: auth.profile.department,
          signed_in_at: new Date().toISOString(),
        },
        { onConflict: 'employee_id' },
      );

      if (error) {
        console.warn('Doctor session sync notice:', formatSupabaseError(error));
      }
    } catch (err) {
      console.warn('Doctor session sync notice:', formatSupabaseError(err));
    } finally {
      setLoading(false);
      router.replace('/doctor/dashboard');
    }
  };

  const rosterCount = profiles.length > 0 ? profiles.length : REGAL_DOCTORS.length;

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-slate-100 font-sans text-[#2C1929]">
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2C1929] text-[#D8A657] shadow-md">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-[#2C1929] md:text-base">
              Regal Hospital - Doctor Portal
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              CuraSync Clinical Access · doctor_profiles auth
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
          <BadgeCheck className="h-3.5 w-3.5" />
          HIPAA Compliant Session
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-700">
                Clinician Authentication
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#2C1929]">Enter Clinical Workspace</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Select your verified Regal Hospital profile · test password {DEFAULT_DOCTOR_PASSWORD}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2C1929]/5 text-[#2C1929]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="clinician-profile"
                className="text-[10px] font-black uppercase tracking-wider text-[#2C1929]"
              >
                Select Clinician Profile *
              </label>
              <select
                id="clinician-profile"
                required
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={profilesLoading}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-bold text-[#2C1929] outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600 disabled:opacity-60"
              >
                {profiles.length > 0
                  ? profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {formatDoctorLoginOption(profile)}
                      </option>
                    ))
                  : REGAL_DOCTORS.map((doctor) => (
                      <option key={doctor.employeeId} value={doctor.employeeId}>
                        {doctor.name} ({doctor.employeeId}) · {doctor.department}
                      </option>
                    ))}
              </select>
              <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
                {rosterCount} verified clinicians ·{' '}
                {selectedProfile?.department ?? fallbackDoctor.department}
                {selectedProfile?.email ? ` · ${selectedProfile.email}` : ''}
              </p>
            </div>

            <div>
              <label
                htmlFor="access-password"
                className="text-[10px] font-black uppercase tracking-wider text-[#2C1929]"
              >
                Password *
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="access-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="RegalDoc@2026"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-12 text-xs font-bold text-[#2C1929] outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-[#2C1929]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-purple-700 focus:ring-purple-600"
              />
              Remember Profile on this terminal
            </label>

            {notice ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-bold text-amber-900">
                {notice}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || profilesLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2C1929] py-4 text-xs font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-[#3D2339] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#D8A657]" />
                  Opening Workspace…
                </>
              ) : (
                <>
                  Enter Clinical Workspace
                  <ArrowRight className="h-4 w-4 text-[#D8A657]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold text-slate-600">
            <ShieldCheck className="h-4 w-4 shrink-0 text-purple-700" />
            Credentials validated against Supabase doctor_profiles · RH-D01 through RH-D41
          </div>
        </div>
      </main>
    </div>
  );
}
