'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, ShieldCheck, ArrowRight } from 'lucide-react';

export default function DoctorLoginPage() {
  const router = useRouter();
  const [selectedDoctor, setSelectedDoctor] = useState({
    doctor_name: 'Dr CHANDRAKANTH S KESARI',
    employeeId: 'RH-D06',
    department: 'General Surgery',
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_doctor_session', JSON.stringify(selectedDoctor));
    }
    router.push('/doctor/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F2F6FA] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-[#9DA6CD]/30 bg-white shadow-2xl grid md:grid-cols-2">
        
        {/* LEFT BRANDING PANEL */}
        <div className="bg-gradient-to-br from-[#894A66] via-[#93688E] to-[#9887B1] p-8 text-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-md border border-white/20 text-xs font-black text-[#BDE2F5]">
              <Stethoscope className="h-4 w-4" /> REGAL HOSPITAL • Doctor Portal
            </div>
            <h1 className="mt-8 text-3xl font-black leading-tight">
              Sign in to access your clinical workspace.
            </h1>
            <p className="mt-3 text-xs font-bold text-[#BDE2F5]">
              Manage live OPD SmartQ appointments, medical records, patient messaging, and daily schedules.
            </p>
          </div>

          <div className="space-y-2 text-xs font-extrabold text-white/90 pt-8 border-t border-white/20">
            <p className="flex items-center gap-2">✓ Encrypted doctor and patient sessions</p>
            <p className="flex items-center gap-2">✓ Real-time OPD queue synchronization</p>
            <p className="flex items-center gap-2">✓ 41 verified hospital clinicians</p>
          </div>
        </div>

        {/* RIGHT LOGIN FORM */}
        <div className="p-8 space-y-6 flex flex-col justify-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9887B1]">Authentication Required</span>
            <h2 className="text-2xl font-black text-[#894A66]">Doctor Sign In</h2>
            <p className="text-xs font-bold text-[#9887B1]">Select your profile or enter employee credentials to proceed.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[#2C243B]">Select Clinician Profile *</label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'RH-D06') {
                    setSelectedDoctor({
                      doctor_name: 'Dr CHANDRAKANTH S KESARI',
                      employeeId: 'RH-D06',
                      department: 'General Surgery',
                    });
                  } else {
                    setSelectedDoctor({
                      doctor_name: 'Dr SURIRAJU V',
                      employeeId: 'RH-D01',
                      department: 'Urology',
                    });
                  }
                }}
                className="mt-1 w-full rounded-2xl border border-[#9DA6CD]/30 bg-[#F2F6FA] p-3.5 text-xs font-bold text-[#2C243B] focus:border-[#894A66] focus:outline-none"
              >
                <option value="RH-D06">Dr CHANDRAKANTH S KESARI (RH-D06) - General Surgery</option>
                <option value="RH-D01">Dr SURIRAJU V (RH-D01) - Urology</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-[#2C243B]">Employee ID / Email *</label>
              <input
                type="text"
                readOnly
                value={selectedDoctor.employeeId}
                className="mt-1 w-full rounded-2xl border border-[#9DA6CD]/30 bg-[#F2F6FA] p-3.5 text-xs font-bold text-[#2C243B]"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-[#2C243B]">Password *</label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="mt-1 w-full rounded-2xl border border-[#9DA6CD]/30 bg-[#F2F6FA] p-3.5 text-xs font-bold text-[#2C243B]"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#894A66] py-4 text-xs font-black text-white shadow-lg hover:bg-[#93688E] transition"
            >
              Access Doctor Dashboard <ArrowRight className="h-4 w-4 text-[#BDE2F5]" />
            </button>
          </form>

          <div className="rounded-2xl bg-[#BDE2F5]/20 p-3 text-[11px] font-bold text-[#894A66] flex items-center gap-2 border border-[#9DA6CD]/20">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Encrypted hospital onboarding session active.</span>
          </div>
        </div>

      </div>
    </div>
  );
}