'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';

function CuraSyncAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/patient/dashboard';

  const [email, setEmail] = useState('aishwarya@gmail.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Store session keys in localStorage so layout guards let you through
    if (typeof window !== 'undefined') {
      const patientId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      localStorage.setItem('patient_full_name', 'Aishwarya D S');
      localStorage.setItem('selected_hospital_name', 'Regal Hospital');
      localStorage.setItem('curasync_patient_id', patientId);
      localStorage.setItem(
        'curasync_patient_session',
        JSON.stringify({
          email,
          patient_id: patientId,
          authenticated: true,
          login_time: new Date().toISOString(),
        })
      );
    }

    // 2. Perform smooth redirect to patient dashboard
    setTimeout(() => {
      setLoading(false);
      router.replace(decodeURIComponent(nextUrl));
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-[36px] bg-white/80 p-8 md:p-12 shadow-2xl backdrop-blur-xl border border-white/40 grid md:grid-cols-2 gap-8 items-center">
      
      {/* LEFT BRAND PANEL */}
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#623E5D] to-[#42263F] text-white shadow-xl">
          <Heart className="h-12 w-12 text-[#E2C7DD] animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-[#2D1B2A]">CuraSync Health</h1>
        <p className="text-xs font-bold text-[#72526D] max-w-xs">
          Access real-time queues, book top specialists, and view records.
        </p>
      </div>

      {/* RIGHT LOGIN FORM */}
      <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-black text-[#2D1B2A]">Welcome Back</h2>
            <p className="text-xs font-bold text-[#72526D]">Sign in to access your dashboard</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5ECF3] text-[#623E5D]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[#72526D]">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#72526D]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aishwarya@gmail.com"
                className="w-full rounded-2xl border border-slate-200 bg-[#FAF7F9] py-3.5 pl-10 pr-4 text-xs font-bold text-[#2D1B2A] focus:border-[#623E5D] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[#72526D]">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#72526D]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-[#FAF7F9] py-3.5 pl-10 pr-4 text-xs font-bold text-[#2D1B2A] focus:border-[#623E5D] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#52304E] py-4 text-xs font-black text-white shadow-lg hover:bg-[#3D223A] transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#E2C7DD]" /> Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] font-bold text-[#72526D]">
          Don&apos;t have an account? <span className="text-[#52304E] font-black underline cursor-pointer">Register now</span>
        </p>
      </div>

    </div>
  );
}

export default function CuraSyncLoginPage() {
  return (
    <div className="min-h-screen bg-[#F5ECE8] flex items-center justify-center p-6 font-sans">
      <Suspense
        fallback={
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-[#52304E]" />
            <span className="text-xs font-black text-[#2D1B2A]">Loading CuraSync Health...</span>
          </div>
        }
      >
        <CuraSyncAuthForm />
      </Suspense>
    </div>
  );
}