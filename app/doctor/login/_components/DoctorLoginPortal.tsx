'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Stethoscope,
  Lock,
  ArrowRight,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  Activity,
  CheckCircle2,
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

const ACCENT: Record<string, { from: string; to: string; glow: string }> = {
  'RH-D06': { from: '#0D9488', to: '#0284C7', glow: 'rgba(45, 212, 191, 0.35)' },
  'RH-D07': { from: '#7C3AED', to: '#DB2777', glow: 'rgba(192, 132, 252, 0.35)' },
  'RH-D08': { from: '#D97706', to: '#DC2626', glow: 'rgba(251, 191, 36, 0.35)' },
  default: { from: '#005B52', to: '#0284C7', glow: 'rgba(56, 189, 248, 0.35)' },
};

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
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

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

  const accent = ACCENT[previewDoctor?.doctor_id ?? ''] ?? ACCENT.default;

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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
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
    <div
      className="min-h-screen relative overflow-hidden bg-[#020617] text-white font-sans"
      onMouseMove={handleMouseMove}
    >
      <style jsx global>{`
        @keyframes auroraShift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
          33% { transform: translate(4%, -3%) scale(1.08); opacity: 0.75; }
          66% { transform: translate(-3%, 2%) scale(0.96); opacity: 0.5; }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes floatHud {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(4px); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.06); opacity: 0.15; }
        }
        @keyframes breatheAvatar {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.03); }
        }
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes successPop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .aurora-blob { animation: auroraShift 14s ease-in-out infinite; }
        .orbit-ring { animation: orbitSpin 28s linear infinite; }
        .hud-float { animation: floatHud 5s ease-in-out infinite; }
        .hud-float-delay { animation: floatHud 5.5s ease-in-out infinite 0.8s; }
        .pulse-halo { animation: pulseRing 4s ease-in-out infinite; }
        .avatar-breathe { animation: breatheAvatar 4s ease-in-out infinite; }
        .btn-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
        .success-pop { animation: successPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* Aurora background */}
      <div
        className="aurora-blob absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: accent.glow }}
      />
      <div className="aurora-blob absolute bottom-0 right-0 w-[640px] h-[640px] rounded-full blur-[140px] pointer-events-none bg-cyan-500/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.15),transparent_55%)] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl bg-white/[0.03]">

          {/* LEFT — Credentials vault */}
          <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 bg-white/[0.97] text-slate-900 flex flex-col justify-between">
            <div>
              <div className="mb-10">
                <RegalHospitalLogo heightClass="h-10" framed className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">
                  Clinician Secure Gateway · HOSP-01
                </p>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
                  Your private
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                    EMR workstation
                  </span>
                </h1>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Hospital-issued credentials unlock an isolated cockpit. Patient queues, prescriptions, and records never cross between doctors.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {loginSuccess ? (
                <div className="success-pop py-12 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">Identity Verified</p>
                    <p className="text-xs text-slate-500 mt-1">Opening your isolated clinical cockpit…</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} autoComplete={LOGIN_FORM_AUTOCOMPLETE} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                      Hospital Doctor ID / Email
                    </label>
                    <div className="relative group">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-4 group-focus-within:text-teal-600 transition-colors" />
                      <input
                        type="text"
                        name="doctor-portal-identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Doctor ID or hospital email"
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                        {...LOGIN_IDENTIFIER_INPUT_PROPS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                      Security PIN (Hospital Issued)
                    </label>
                    <div className="relative group">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4 group-focus-within:text-teal-600 transition-colors" />
                      <input
                        type={showPasscode ? 'text' : 'password'}
                        name="doctor-portal-passcode"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Enter your unique clinician PIN"
                        required
                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                        {...LOGIN_PASSWORD_INPUT_PROPS}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasscode(!showPasscode)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-semibold">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                      />
                      Remember this device
                    </label>
                    <span className="flex items-center gap-1 text-teal-700 font-bold">
                      <Fingerprint className="w-3.5 h-3.5" />
                      MFA Ready
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 btn-shimmer text-white font-black text-sm shadow-xl shadow-teal-700/30 hover:shadow-teal-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying with Hospital Registry…
                      </>
                    ) : (
                      <>
                        Unlock My Workstation
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Dynamic roster from Supabase */}
            {roster.length > 0 && !loginSuccess && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
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
                        className={`text-left px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-sm ring-2 ring-teal-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="block font-mono text-[10px] opacity-70">{doc.doctor_id}</span>
                        {doc.doctor_name.replace(/^Dr\.?\s*/i, 'Dr. ')}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                  Each doctor receives a unique PIN from hospital administration. Never share credentials.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — Animated showcase */}
          <div
            className="lg:col-span-7 relative p-8 sm:p-12 flex flex-col justify-between overflow-hidden min-h-[520px]"
            style={{
              background: `linear-gradient(135deg, ${accent.from} 0%, #0F766E 45%, ${accent.to} 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGg4djhoLTg6eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDMiLz48L2c+PC9zdmc+')] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 px-4 py-2 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                Hospital Cloud · Live
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                <ShieldCheck className="w-4 h-4" />
                Zero-Cross Isolation
              </div>
            </div>

            <div
              className="relative z-10 flex-1 flex items-center justify-center my-6"
              style={{
                transform: `perspective(900px) rotateY(${mouse.x * 4}deg) rotateX(${mouse.y * -3}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
            >
              <div className="absolute w-72 h-72 rounded-full border border-white/20 pulse-halo" />
              <div className="absolute w-80 h-80 rounded-full border-2 border-dashed border-white/15 orbit-ring" />

              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/30 shadow-2xl flex items-center justify-center avatar-breathe">
                <div className="w-[88%] h-[88%] rounded-full bg-gradient-to-b from-white/90 to-sky-100 flex items-end justify-center overflow-hidden">
                  <img
                    src="https://illustrations.popsy.co/teal/doctor.svg"
                    alt="Clinician"
                    className="w-full h-full object-contain p-2 drop-shadow-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <Stethoscope className="absolute w-20 h-20 text-teal-700/20" />
                </div>
              </div>

              <div className="absolute top-4 left-0 hud-float bg-white text-slate-900 rounded-2xl p-3.5 shadow-2xl border border-white/50 flex items-center gap-3 max-w-[200px]">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rx Sync</p>
                  <p className="text-xs font-black">0s Prescription Push</p>
                </div>
              </div>

              <div className="absolute bottom-4 right-0 hud-float-delay bg-white text-slate-900 rounded-2xl p-3.5 shadow-2xl border border-white/50 flex items-center gap-3 max-w-[210px]">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Private Queue</p>
                  <p className="text-xs font-black">Your Patients Only</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              {previewDoctor && (
                <div className="bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">
                    Active profile preview
                  </p>
                  <h3 className="text-xl font-black">{previewDoctor.doctor_name}</h3>
                  <p className="text-sm text-white/80 mt-0.5">
                    {previewDoctor.department} · {previewDoctor.specialization}
                  </p>
                  <p className="text-xs font-mono text-cyan-100 mt-2">{previewDoctor.doctor_id}</p>
                </div>
              )}

              <div className="flex items-start gap-2 text-[11px] text-white/75 leading-relaxed">
                <Sparkles className="w-4 h-4 shrink-0 text-cyan-200 mt-0.5" />
                <span>
                  Appointments booked for other consultants are cryptographically shielded from your session. Only your OPD queue appears after login.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
