'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, LogIn, Building2, Mail, Lock, Loader2 } from 'lucide-react';

export default function PatientLoginPage() {
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

    // 1. Persist authenticated session to LocalStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('patient_full_name', 'Aishwarya D S');
      localStorage.setItem('selected_hospital_name', selectedHospital);
      localStorage.setItem('curasync_patient_session', JSON.stringify({
        email,
        hospital: selectedHospital,
        authenticated: true,
        login_time: new Date().toISOString(),
      }));
    }

    // 2. Perform clean redirect to requested next route or dashboard
    setTimeout(() => {
      setLoading(false);
      router.replace(decodeURIComponent(nextUrl));
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f4f9f8] flex items-center justify-center p-6 font-sans text-[#1d3531]">
      <div className="w-full max-w-md rounded-3xl border border-[#daf0eb] bg-white p-8 shadow-2xl space-y-6">
        
        {/* HEADER BADGE */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3b8c7e] text-white shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-[#1d3531]">Patient Check-In</h1>
          <p className="text-xs font-bold text-[#3b8c7e]">
            Select hospital and sign in to access your dashboard
          </p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* SELECT HOSPITAL */}
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

          {/* EMAIL */}
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

          {/* PASSWORD */}
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

          {/* SUBMIT BUTTON */}
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
    </div>
  );
}