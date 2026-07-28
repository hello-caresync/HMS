'use client';

import React, { useState } from 'react';

import { AuthButton, AuthInput } from './AuthShell';
import { verifyMfaChallenge, type MfaChallengeState } from '@/app/lib/auth';

type MfaChallengePlaceholderProps = {
  challenge: MfaChallengeState;
  onVerified: () => void;
  onCancel: () => void;
};

/**
 * Structural placeholder for a future MFA verification step.
 * Wire this between primary login and session issuance when MFA is enabled.
 */
export default function MfaChallengePlaceholder({
  challenge,
  onVerified,
  onCancel,
}: MfaChallengePlaceholderProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await verifyMfaChallenge();
    setLoading(false);

    if (result.ok === false) {
      setError(result.error ?? 'Verification failed.');
      return;
    }

    onVerified();
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm font-medium text-[#49769F]">
        Multi-factor authentication is required for this tenant. Enter your 6-digit
        verification code.
      </p>

      <AuthInput
        id="mfa-code"
        label="Verification code"
        value={code}
        onChange={setCode}
        placeholder="000000"
        autoComplete="one-time-code"
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}

      <AuthButton loading={loading} disabled={code.trim().length < 6}>
        Verify &amp; Continue
      </AuthButton>

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-xs font-bold text-[#49769F] hover:text-[#001D39]"
      >
        Cancel and return to sign in
      </button>
    </form>
  );
}
