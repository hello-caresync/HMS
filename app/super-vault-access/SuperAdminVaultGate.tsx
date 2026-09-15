'use client';

import { useState } from 'react';

type SuperAdminVaultGateProps = {
  onUnlock: () => void;
};

export function SuperAdminVaultGate({ onUnlock }: SuperAdminVaultGateProps) {
  const [passcode, setPasscode] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthenticate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setHasError(false);

    try {
      const res = await fetch('/api/super-vault/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      if (res.ok) {
        onUnlock();
        return;
      }

      setHasError(true);
    } catch {
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070A13] text-white p-4 font-sans">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black tracking-widest text-emerald-400 uppercase">
            Super-Admin Vault
          </h2>
          <p className="text-xs text-slate-400">
            Master passcode required. This route is unlisted and excluded from public navigation.
          </p>
        </div>

        {hasError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
            Invalid master passcode.
          </div>
        )}

        <form onSubmit={handleAuthenticate} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
              Master Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                autoFocus
                autoComplete="current-password"
                placeholder="Enter master passcode"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setHasError(false);
                }}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'Authenticating…' : 'Authenticate Vault Access'}
          </button>
        </form>
      </div>
    </div>
  );
}
