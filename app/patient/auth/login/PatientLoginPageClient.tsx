'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles, User, HeartPulse } from 'lucide-react';

export default function PatientLoginPageClient() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/patient/appointments');
    }, 1000);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#F8F4F1] via-[#E2D2C8]/40 to-[#CEB2C0]/30 p-4 font-sans text-[#2D232A]">
      
      {/* Background Glows */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#572E54]/15 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#D8A657]/20 blur-3xl" />

      {/* Main Glass Split Card */}
      <div
        className={`relative flex min-h-[550px] w-full max-w-4xl items-center justify-between rounded-[2.5rem] border border-white/60 bg-white/70 p-6 shadow-2xl backdrop-blur-xl transition-all duration-700 ease-in-out md:p-10 ${
          isExpanded ? 'max-w-5xl' : 'max-w-xl'
        }`}
      >
        {/* HERO SECTION */}
        <div
          className={`flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out ${
            isExpanded ? 'w-full md:w-1/2 md:pr-6' : 'w-full'
          }`}
        >
          {/* Animated Floating Graphic */}
          <div className="relative mb-6 flex h-48 w-48 animate-bounce items-center justify-center rounded-full bg-gradient-to-br from-[#572E54] to-[#8E7692] shadow-2xl [animation-duration:3s]">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <HeartPulse className="h-20 w-20 text-white" />
              <Sparkles className="absolute right-4 top-4 h-6 w-6 text-[#D8A657]" />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#482A41] md:text-4xl">
            CuraSync Health
          </h1>
          <p className="mt-2 max-w-xs text-sm font-medium text-[#7A6374]">
            {isExpanded
              ? 'Access real-time queues, book top specialists, and view records.'
              : 'Welcome to your smart digital health companion.'}
          </p>

          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="mt-8 flex items-center gap-2 rounded-full bg-[#572E54] px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-[#482A41] hover:shadow-2xl active:scale-95"
            >
              Sign In to Portal <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* SLIDE-IN FORM */}
        <div
          className={`transition-all duration-700 ease-in-out ${
            isExpanded
              ? 'w-full opacity-100 max-h-[600px] md:w-1/2 md:pl-6'
              : 'w-0 opacity-0 max-h-0 overflow-hidden pointer-events-none'
          }`}
        >
          <div className="rounded-3xl border border-[#E2D2C8] bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#482A41]">
                  {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-xs text-[#7A6374]">
                  {isRegistering ? 'Register to manage care' : 'Sign in to access your dashboard'}
                </p>
              </div>
              <span className="rounded-full bg-[#572E54]/10 p-2.5 text-[#572E54]">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="ml-3 mb-1 block text-xs font-bold uppercase text-[#7A6374]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3 h-4 w-4 text-[#7A6374]" />
                    <input
                      type="text"
                      required
                      placeholder="Aishwarya D S"
                      className="w-full rounded-full border border-[#E2D2C8] bg-[#F8F4F1]/50 py-2.5 pl-11 pr-4 text-sm font-medium focus:border-[#572E54] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="ml-3 mb-1 block text-xs font-bold uppercase text-[#7A6374]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 h-4 w-4 text-[#7A6374]" />
                  <input
                    type="email"
                    required
                    placeholder="patient@curasync.com"
                    className="w-full rounded-full border border-[#E2D2C8] bg-[#F8F4F1]/50 py-2.5 pl-11 pr-4 text-sm font-medium focus:border-[#572E54] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="ml-3 mb-1 block text-xs font-bold uppercase text-[#7A6374]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 h-4 w-4 text-[#7A6374]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-full border border-[#E2D2C8] bg-[#F8F4F1]/50 py-2.5 pl-11 pr-4 text-sm font-medium focus:border-[#572E54] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-full bg-[#572E54] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#482A41] hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : isRegistering ? 'Register Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs font-semibold text-[#7A6374]">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="font-bold text-[#572E54] underline hover:text-[#482A41]"
              >
                {isRegistering ? 'Sign In' : 'Register now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}