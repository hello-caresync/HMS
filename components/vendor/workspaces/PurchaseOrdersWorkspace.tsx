'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldCheck, User } from 'lucide-react';

export default function PatientLoginPageClient() {
  const router = useRouter();
  const [animationStep, setAnimationStep] = useState<'walking' | 'arrived'>('walking');
  const [isRegistering, setIsRegistering] = useState(true); // Default matching video "Register now"
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Character walks across screen for 2.2 seconds, then triggers form dropdown
    const timer = setTimeout(() => {
      setAnimationStep('arrived');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/patient/appointments');
    }, 1000);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#2A3950] font-sans text-white">
      
      {/* Container Box matching video aspect ratio */}
      <div className="relative flex h-[620px] w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-[#253246] shadow-2xl p-6">
        
        {/* WALKING CHARACTER / HERO ILLUSTRATION */}
        <div
          className={`absolute bottom-16 flex flex-col items-center transition-all duration-[1800ms] cubic-bezier(0.25, 1, 0.5, 1) ${
            animationStep === 'walking'
              ? 'left-[10%] scale-110'
              : 'left-[12%] md:left-[16%] scale-100'
          }`}
        >
          {/* Animated Walking/Bouncing Character Placeholder */}
          <div className="relative flex h-52 w-40 flex-col items-center justify-end">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#572E54] shadow-2xl animate-bounce [animation-duration:1.2s]">
              {/* Character head & body SVG / image */}
              <svg className="h-24 w-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="7" r="4" />
                <path d="M5.5 21a8.38 8.38 0 0113 0" />
              </svg>
            </div>
            {/* Ground Shadow */}
            <div className="mt-2 h-3 w-28 rounded-full bg-black/40 blur-sm animate-pulse" />
          </div>
        </div>

        {/* DROPDOWN / SLIDE-DOWN FORM (Appears right after walking finishes) */}
        <div
          className={`absolute right-8 md:right-16 w-full max-w-md transition-all duration-1000 ease-out ${
            animationStep === 'arrived'
              ? 'top-10 opacity-100 translate-y-0'
              : '-top-full opacity-0 -translate-y-20 pointer-events-none'
          }`}
        >
          <div className="rounded-2xl bg-white p-8 text-[#2D232A] shadow-2xl border border-slate-100">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#482A41]">
                  {isRegistering ? 'Register now' : 'Sign In'}
                </h2>
                <p className="text-xs text-[#7A6374]">
                  {isRegistering
                    ? 'Enter your info to register for upcoming medical sessions'
                    : 'Enter your account credentials to continue'}
                </p>
              </div>
              <span className="rounded-full bg-[#572E54]/10 p-2.5 text-[#572E54]">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-[#7A6374]">
                    What is your name?
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6374]" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:border-[#572E54] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[#7A6374]">
                  Enter your email address:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6374]" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:border-[#572E54] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[#7A6374]">
                  Password:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6374]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:border-[#572E54] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full rounded-xl bg-[#572E54] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#482A41] active:scale-98 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : isRegistering ? 'Submit' : 'Login'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs font-medium text-[#7A6374]">
              {isRegistering ? 'Already registered?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="font-bold text-[#572E54] underline hover:text-[#482A41]"
              >
                {isRegistering ? 'Sign in here' : 'Register now'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}