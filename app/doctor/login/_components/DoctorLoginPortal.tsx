'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LOGIN_FORM_AUTOCOMPLETE,
  LOGIN_IDENTIFIER_INPUT_PROPS,
  LOGIN_PASSWORD_INPUT_PROPS,
} from '@/lib/auth/login-form-security';
import { supabase } from '@/lib/supabase';
import {
  resolveDoctorConsultationFeeFromSources,
  saveDoctorSession,
  type DoctorSession,
} from '@/lib/doctor/session';
import { resolveDoctorConsultationFee } from '@/lib/hospital/doctors';
import {
  recordRealStaffLogin,
  resolveCredentialHospitalId,
  resolveCredentialHospitalName,
} from '@/lib/recordStaffLogin';
import { resolveLoginRedirect } from '@/lib/auth/safe-redirect';
import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import {
  Lock,
  ArrowRight,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  Users,
} from 'lucide-react';

interface HospitalDoctorRow {
  doctor_id: string;
  doctor_name: string;
  email?: string;
  department?: string;
  specialization?: string;
  passcode?: string;
  consultation_fee?: number | string | null;
  fee?: number | string | null;
  hospital_code?: string;
}

export default function DoctorLoginPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postLoginPath = resolveLoginRedirect(
    searchParams.get('redirect'),
    '/doctor/dashboard',
    ['/doctor'],
  );

  const [roster, setRoster] = useState<HospitalDoctorRow[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const previewDoctor = useMemo(() => {
    const key = identifier.trim().toUpperCase();
    return (
      roster.find(
        (d) =>
          d.doctor_id.toUpperCase() === key ||
          d.email?.toLowerCase() === identifier.trim().toLowerCase(),
      ) ?? roster[0]
    );
  }, [identifier, roster]);

  useEffect(() => {
    const loadRoster = async () => {
      const { data } = await supabase
        .from('hospital_doctors')
        .select('doctor_id, doctor_name, email, department, specialization')
        .eq('is_active', true)
        .order('doctor_name');

      if (data?.length) {
        setRoster(data as HospitalDoctorRow[]);
        setIdentifier((prev) => prev || data[0].doctor_id);
      }
    };
    void loadRoster();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const cleanInput = identifier.trim();
      const cleanPasscode = passcode.trim();

      if (!cleanInput || !cleanPasscode) {
        setErrorMessage('Enter your hospital-issued Doctor ID and security PIN.');
        return;
      }

      const { data, error } = await supabase
        .from('hospital_doctors')
        .select('*')
        .eq('is_active', true)
        .or(`doctor_id.eq.${cleanInput},email.eq.${cleanInput}`)
        .maybeSingle();

      if (error || !data) {
        setErrorMessage('Credentials not found in Regal Hospital registry. Contact IT admin.');
        return;
      }

      if (String(data.passcode) !== cleanPasscode) {
        setErrorMessage('Invalid security PIN. Each clinician has a unique hospital-issued passcode.');
        return;
      }

      let configuredFee = resolveDoctorConsultationFeeFromSources([data as HospitalDoctorRow], 0);
      if (!configuredFee) {
        const registry = await supabase
          .from('doctors')
          .select('consultation_fee, fee, full_name, doctor_name')
          .or(
            [
              `doctor_code.eq.${data.doctor_id}`,
              `registration_number.eq.${data.doctor_id}`,
              data.email ? `email.eq.${data.email}` : '',
            ]
              .filter(Boolean)
              .join(','),
          )
          .limit(3);
        configuredFee = resolveDoctorConsultationFeeFromSources(
          (registry.data ?? []) as HospitalDoctorRow[],
          0,
        );
      }

      const session: DoctorSession = {
        doctorId: data.doctor_id,
        doctorName: data.doctor_name,
        department: data.department,
        specialization: data.specialization,
        email: data.email,
        hospitalCode: data.hospital_code,
        consultationFee: configuredFee || resolveDoctorConsultationFee(data as Record<string, unknown>, 0) || undefined,
        fee: configuredFee || undefined,
      };

      const hospitalId = resolveCredentialHospitalId(data.hospital_code);
      try {
        await recordRealStaffLogin({
          id: data.doctor_id,
          hospital_id: hospitalId,
          hospital_name: resolveCredentialHospitalName(hospitalId),
          full_name: data.doctor_name,
          staff_type: 'Doctor',
          department: data.department ?? 'General Medicine',
          email: data.email ?? `${data.doctor_id.toLowerCase()}@regalhospital.com`,
          temporary_passcode: cleanPasscode,
          portal_access: '/doctor/dashboard',
        });
      } catch (recordErr) {
        console.warn('Live credential vault sync skipped:', recordErr);
      }

      saveDoctorSession(session, rememberMe);
      setLoginSuccess(true);
      router.refresh();

      setTimeout(() => {
        router.push(postLoginPath);
      }, 1200);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] font-sans text-white">
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes successPop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .btn-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
        .success-pop { animation: successPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.18),transparent_55%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl md:grid-cols-2">

          {/* LEFT — Credentials */}
          <div className="flex flex-col justify-between bg-white/[0.97] p-8 text-slate-900 sm:p-10 lg:p-12">
            <div>
              <div className="mb-10">
                <RegalHospitalLogo heightClass="h-10" framed className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">
                  Clinician Secure Gateway · HOSP-01
                </p>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
                  Your private
                  <span className="block bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    EMR workstation
                  </span>
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Hospital-issued credentials unlock an isolated cockpit. Patient queues, prescriptions,
                  and records never cross between doctors.
                </p>
              </div>

              {errorMessage ? (
                <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              ) : null}

              {loginSuccess ? (
                <div className="success-pop flex flex-col items-center gap-4 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">Identity Verified</p>
                    <p className="mt-1 text-xs text-slate-500">Opening your isolated clinical cockpit…</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} autoComplete={LOGIN_FORM_AUTOCOMPLETE} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Hospital Doctor ID / Email
                    </label>
                    <div className="group relative">
                      <Building2 className="absolute left-4 top-4 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                      <input
                        type="text"
                        name="doctor-portal-identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Doctor ID or hospital email"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                        {...LOGIN_IDENTIFIER_INPUT_PROPS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Security PIN (Hospital Issued)
                    </label>
                    <div className="group relative">
                      <Lock className="absolute left-4 top-4 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                      <input
                        type={showPasscode ? 'text' : 'password'}
                        name="doctor-portal-passcode"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Enter your unique clinician PIN"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                        {...LOGIN_PASSWORD_INPUT_PROPS}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasscode(!showPasscode)}
                        className="absolute right-4 top-4 cursor-pointer text-slate-400 hover:text-slate-700"
                      >
                        {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded accent-teal-600"
                      />
                      Remember this device
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-shimmer flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 py-4 text-sm font-black text-white shadow-xl shadow-teal-700/30 transition-all hover:shadow-teal-600/40 active:scale-[0.99] disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Verifying with Hospital Registry…
                      </>
                    ) : (
                      <>
                        Unlock My Workstation
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {roster.length > 0 && !loginSuccess ? (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Registered clinicians — select profile
                </p>
                <div className="flex flex-wrap gap-2">
                  {roster.map((doc) => {
                    const active = identifier.trim().toUpperCase() === doc.doctor_id.toUpperCase();
                    return (
                      <button
                        key={doc.doctor_id}
                        type="button"
                        onClick={() => {
                          setIdentifier(doc.doctor_id);
                          setPasscode('');
                          setErrorMessage('');
                        }}
                        className={`cursor-pointer rounded-xl border px-3 py-2 text-left text-[11px] font-bold transition-all ${
                          active
                            ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-sm ring-2 ring-teal-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="block font-mono text-[10px] opacity-70">{doc.doctor_id}</span>
                        {doc.doctor_name.replace(/^Dr\.?\s*/i, 'Dr. ')}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
                  Each doctor receives a unique PIN from hospital administration. Never share credentials.
                </p>
              </div>
            ) : null}
          </div>

          {/* RIGHT — Clinical workspace preview */}
          <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-950 via-emerald-900 to-teal-900 p-8 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                HOSP-01 · Bengaluru Care Center
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-100/90">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Encrypted Clinician Node · v2026.1
              </div>
            </div>

            <div className="relative z-10 my-6 flex flex-1 items-center">
              <div className="w-full rounded-2xl border border-white/15 bg-slate-950/45 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/80">
                      Live OPD Cockpit Preview
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-white">
                      Doctor Consultation Queue · Active Shift
                    </h2>
                    {previewDoctor ? (
                      <p className="mt-0.5 text-xs text-white/60">
                        {previewDoctor.doctor_name} · {previewDoctor.department}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                      <Users className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
                      4 Pending Patients
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                      <Clock3 className="h-3.5 w-3.5 text-cyan-200" aria-hidden />
                      Avg. Wait: 12 min
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">Patient Mani</p>
                      <p className="text-xs text-emerald-100/80">38y · Male</p>
                      <p className="mt-2 text-xs leading-relaxed text-white/75">
                        &ldquo;General checkup · Vitals Recorded&rdquo;
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-cyan-200">Token #04</p>
                      <span className="mt-1 inline-block rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100">
                        Ready for Consult
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-teal-400/30 bg-teal-500/15 px-3 py-2 text-xs font-semibold text-teal-100">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                  Real-Time Digital Rx &amp; Pharmacy Clearance
                </div>
              </div>
            </div>

            <p className="relative z-10 text-[11px] leading-relaxed text-white/70">
              Doctor-isolated data tenancy. Your active OPD tokens, clinical vitals intake, and
              prescriptions are synchronized strictly with your authorized clinician session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
