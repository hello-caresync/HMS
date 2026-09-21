'use client';

import { useState } from 'react';
import Link from 'next/link';

import { APP_ROUTES } from '../../lib/routes';
import { requestPasswordReset } from '../../lib/auth';
import AuthLoginShell, {
  AuthAlert,
  AuthField,
  AuthPrimaryButton,
} from '../_components/AuthLoginShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const result = await requestPasswordReset(email);
    setLoading(false);
    setIsSuccess(result.ok);
    setMessage(result.message);
  };

  return (
    <AuthLoginShell
      title="Reset Credentials"
      subtitle="Submit your registered work email. IT will process credential recovery per sandbox policy."
      activeGlow="from-teal-500/40 via-emerald-500/30 to-cyan-600/40"
      activeTagColor="bg-teal-500/20 text-teal-300 border-teal-500/30"
      activeTitle="Account Recovery"
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        {message && <AuthAlert tone={isSuccess ? 'success' : 'error'} message={message} />}

        <AuthField
          id="reset-email"
          label="Corporate Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Registered work email"
          autoComplete="off"
        />

        <AuthPrimaryButton
          loading={loading}
          gradientClass="from-teal-500 via-emerald-400 to-cyan-400"
        >
          Request Reset
        </AuthPrimaryButton>

        <p className="text-center text-xs text-slate-600">
          <Link href={APP_ROUTES.login} className="font-semibold text-teal-800 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLoginShell>
  );
}
