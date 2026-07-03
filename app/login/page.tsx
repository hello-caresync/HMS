'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 🚀 ULTRA BYPASS: Route straight to patient dashboard instantly
    router.push('/patient');
    setLoading(false);
    return;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">CuraSync Platform</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to access your secure portal dashboard</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@curasync.com"
              className="w-full rounded-xl border border-slate-200 p-3 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 p-3 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-blue-600 p-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Authenticating Profile...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}