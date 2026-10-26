'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import { resolveAuthUiError } from '@/lib/auth/parseAuthError';
import { supabase } from '@/lib/supabase/client';

export default function PatientResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setReady(Boolean(data.session));
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated. Sign in with the new password.');
      router.replace('/patient/login/');
    } catch (err: unknown) {
      toast.error(resolveAuthUiError(err, 'Could not update the password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AuthSceneBackground tone="patient" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border border-[#E7D7C8] bg-white p-8 shadow-xl"
      >
        <div className="flex justify-center">
          <RegalHospitalLogo heightClass="h-9" framed />
        </div>
        <h1 className="text-center text-lg font-black text-[#361E10]">Choose a new password</h1>
        {checking ? (
          <p className="text-center text-xs text-[#7D6354]">Checking your reset link...</p>
        ) : ready ? (
          <>
            <label className="block text-[11px] font-bold uppercase text-[#7D6354]">
              New password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-[11px] font-bold uppercase text-[#7D6354]">
              Confirm password
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#8C5A3C] py-3 text-xs font-black text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Update password'}
            </button>
          </>
        ) : (
          <p className="text-center text-xs leading-relaxed text-[#7D6354]">
            Open the reset link from your email, then choose a new password here.
          </p>
        )}
      </form>
    </div>
  );
}
