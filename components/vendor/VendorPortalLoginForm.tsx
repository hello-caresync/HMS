'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  LOGIN_FORM_AUTOCOMPLETE,
  LOGIN_IDENTIFIER_INPUT_PROPS,
  LOGIN_PASSWORD_INPUT_PROPS,
} from '@/lib/auth/login-form-security';
import {
  authenticateVendorCredential,
  VENDOR_AUTH_SERVICE_ERROR_MESSAGE,
  VENDOR_INVALID_CREDENTIALS_MESSAGE,
} from '@/lib/auth/vendor-auth';
import { persistVendorSession } from '@/lib/auth/ecosystem-sessions';
import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';

type VendorPortalLoginFormProps = {
  redirectTo?: string;
};

export function VendorPortalLoginForm({
  redirectTo = VENDOR_PORTAL_ROUTES.dashboard,
}: VendorPortalLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVendorLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPasscode = passcode.trim();

      const result = await authenticateVendorCredential(cleanEmail, cleanPasscode);
      if (!result.ok) {
        const message =
          result.error === VENDOR_AUTH_SERVICE_ERROR_MESSAGE ||
          result.error === VENDOR_INVALID_CREDENTIALS_MESSAGE ||
          result.error.startsWith('Enter vendor') ||
          result.error.includes('suspended')
            ? result.error
            : VENDOR_INVALID_CREDENTIALS_MESSAGE;
        setError(message);
        toast.error(message);
        return;
      }

      persistVendorSession(result.vendor);
      toast.success(`Welcome, ${result.vendor.company_name}!`);

      const destination =
        searchParams.get('redirect')?.startsWith('/vendor')
          ? searchParams.get('redirect')!
          : redirectTo;

      router.push(destination);
    } catch (err: unknown) {
      console.error('Vendor login failed:', err);
      setError(VENDOR_AUTH_SERVICE_ERROR_MESSAGE);
      toast.error(VENDOR_AUTH_SERVICE_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-[#dcc2f9]/70 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dcc2f9]/60 text-[#6a38a0]">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-[#2e1053]">Vendor Portal</h1>
          <p className="mt-1 text-xs text-[#684594]">Hospital supply chain partner access</p>
        </div>

        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <form onSubmit={handleVendorLogin} autoComplete={LOGIN_FORM_AUTOCOMPLETE} className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Vendor Rep Email
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                name="vendor-portal-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Vendor representative email"
                className="w-full rounded-xl border border-[#dcc2f9]/70 py-3 pr-3 pl-10 text-sm outline-none focus:border-[#6a38a0] focus:ring-2 focus:ring-[#6a38a0]/20"
                {...LOGIN_IDENTIFIER_INPUT_PROPS}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Portal Security PIN / Passcode
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPasscode ? 'text' : 'password'}
                required
                name="vendor-portal-passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter your portal PIN"
                className="w-full rounded-xl border border-[#dcc2f9]/70 py-3 pr-10 pl-10 text-sm outline-none focus:border-[#6a38a0] focus:ring-2 focus:ring-[#6a38a0]/20"
                {...LOGIN_PASSWORD_INPUT_PROPS}
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6a38a0] py-3 text-sm font-bold text-white hover:bg-[#a36fdb] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enter Vendor Workspace
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
