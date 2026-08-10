'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, LogIn, Building2, Mail, Lock, Loader2 } from 'lucide-react';

function PatientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/patient/dashboard';

  const [selectedHospital, setSelectedHospital] = useState('Regal Hospital');
  const [email, setEmail] = useState('aishwarya@gmail.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('patient_full_name', 'Aishwarya D S');
      localStorage.setItem('selected_hospital_name', selectedHospital);
      localStorage.setItem(
        'curasync_patient_session',
        JSON.stringify({
          email,
          hospital: selectedHospital,
          authenticated: true,
          login_time: new Date().toISOString(),
        })
      );
    }

    setTimeout(() => {
      setLoading(false);
      router.replace(decodeURIComponent(nextUrl));
    }, 400);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-[#daf0eb] bg-white p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3b8c7e] text-white shadow-md">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black text-[#1d3531]">Patient Check-In</h1>
        <p className="text-xs font-bold text-[#3b8c7e]">
          Select hospital and sign in to access your dashboard
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#3b8c7e] mb-1">
            <Building2 className="h-3.5 w-3.5" /> Select Hospital / Clinic *
          </label>
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="w-full rounded-2xl border border-[#daf0eb] bg-[#f4f9f8] p-3.5 text-xs font-bold text-[#1d3531] focus:border-[#3b8c7e] focus:outline-none"
          >
            <option value="Regal Hospital">Regal Hospital • Main Branch</option>
            <option value="Regal Care Clinic">Regal Care Specialty Clinic</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#3b8c7e] mb-1">
            <Mail className="h-3.5 w-3.5" /> Email Address *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-[#daf0eb] bg-[#f4f9f8] p-3.5 text-xs font-bold text-[#1d3531] focus:border-[#3b8c7e] focus:outline-none"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#3b8c7e] mb-1">
            <Lock className="h-3.5 w-3.5" /> Password *
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-[#daf0eb] bg-[#f4f9f8] p-3.5 text-xs font-bold text-[#1d3531] focus:border-[#3b8c7e] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3b8c7e] py-4 text-xs font-black text-white shadow-lg hover:bg-[#2e6e63] transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#bde2f5]" /> Authenticating...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 text-[#bde2f5]" /> Sign In To Hospital
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function PatientLoginPage() {
  return (
    <div className="min-h-screen bg-[#f4f9f8] flex items-center justify-center p-6 font-sans text-[#1d3531]">
      <Suspense
        fallback={
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl border border-[#daf0eb]">
            <Loader2 className="h-5 w-5 animate-spin text-[#3b8c7e]" />
            <span className="text-xs font-black text-[#1d3531]">Loading login screen...</span>
          </div>
        }
      >
        <PatientLoginForm />
      </Suspense>
    </div>
  );
}