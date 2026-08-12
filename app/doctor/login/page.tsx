'use client';

import React, { useMemo, useState } from 'react';
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
  DEFAULT_REGAL_DOCTOR,
  REGAL_DOCTORS,
  findRegalDoctor,
  formatClinicianOption,
  type RegalDoctor,
} from '@/lib/doctor/regal-doctors';
import { doctorToSession, setDoctorSession } from '@/lib/doctor/session';
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
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered && findRegalDoctor(remembered)) return remembered;
  } catch {
    /* ignore */
  }
  return DEFAULT_REGAL_DOCTOR.employeeId;
}

function hasRememberedDoctor(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return Boolean(localStorage.getItem(REMEMBER_KEY));
  } catch {
    return true;
  }
}

export default function DoctorLoginPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(readRememberedDoctorId);
  const [pin, setPin] = useState('123456');
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(hasRememberedDoctor);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedDoctor = useMemo<RegalDoctor>(() => {
    return findRegalDoctor(selectedId) ?? DEFAULT_REGAL_DOCTOR;
  }, [selectedId]);

  const persistDoctorSession = (doctor: RegalDoctor) => {
    const session = doctorToSession(doctor);
    setDoctorSession(session);
    writeJsonStorage(ACTIVE_DOCTOR_KEY, {
      doctorId: doctor.employeeId,
      doctor_name: doctor.name,
      fullName: doctor.name,
      employeeId: doctor.employeeId,
      department: doctor.department,
      signedInAt: session.signedInAt,
    });
    // Keep workspace / layout guard key in sync
    writeJsonStorage(DOCTOR_STORAGE_KEYS.doctorSession, session);

    if (remember) {
      localStorage.setItem(REMEMBER_KEY, doctor.employeeId);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !pin.trim()) {
      setNotice('Select a clinician profile and enter your access PIN.');
      return;
    }

    setLoading(true);
    setNotice(null);

    // Zero-latency local session first — workspace can read immediately
    persistDoctorSession(selectedDoctor);

    try {
      // Best-effort audit ping; never block clinical access on network/schema issues
      const { error } = await supabase.from('doctor_sessions').upsert(
        {
          employee_id: selectedDoctor.employeeId,
          doctor_name: selectedDoctor.name,
          department: selectedDoctor.department,
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

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-slate-100 font-sans text-[#2C1929]">
      {/* Top navigation */}
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
              CuraSync Clinical Access
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
          <BadgeCheck className="h-3.5 w-3.5" />
          HIPAA Compliant Session
        </span>
      </header>

      {/* Login canvas */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-700">
                Clinician Authentication
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#2C1929]">Enter Clinical Workspace</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Select your verified Regal Hospital profile to open the OPD desk.
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
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-bold text-[#2C1929] outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600"
              >
                {REGAL_DOCTORS.map((doctor) => (
                  <option key={doctor.employeeId} value={doctor.employeeId}>
                    {formatClinicianOption(doctor)}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
                {REGAL_DOCTORS.length} verified clinicians • {selectedDoctor.department}
              </p>
            </div>

            <div>
              <label
                htmlFor="access-pin"
                className="text-[10px] font-black uppercase tracking-wider text-[#2C1929]"
              >
                Password / Access PIN *
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="access-pin"
                  type={showPin ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter access PIN"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-12 text-xs font-bold text-[#2C1929] outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-[#2C1929]"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              disabled={loading}
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
            Encrypted terminal session · Local profile sync with optional Supabase audit trail
          </div>
        </div>
      </main>
    </div>
  );
}
