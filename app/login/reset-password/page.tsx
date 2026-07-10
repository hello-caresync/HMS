'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import AuthShell, {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthLink,
} from '../../components/auth/AuthShell';
import PasswordPolicyChecklist from '../../components/auth/PasswordPolicyChecklist';
import { APP_ROUTES } from '../../lib/routes';
import { completePasswordReset, evaluatePasswordPolicy } from '../../lib/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const policy = evaluatePasswordPolicy(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!policy.valid) {
      setMessage('Password does not meet Nexora security policy.');
      setIsSuccess(false);
      return;
    }

    if (!passwordsMatch) {
      setMessage('Passwords do not match.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await completePasswordReset(password);
    setLoading(false);
    setIsSuccess(result.ok);
    setMessage(result.message);

    if (result.ok) {
      window.setTimeout(() => router.push(APP_ROUTES.login), 1800);
    }
  };

  return (
    <AuthShell
      title="Create new password"
      subtitle="Choose a strong password that meets Nexora enterprise policy."
      footer={
        <>
          Return to <AuthLink href={APP_ROUTES.login}>sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <AuthAlert tone={isSuccess ? 'success' : 'error'} message={message} />
        )}

        <AuthInput
          id="new-password"
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <PasswordPolicyChecklist password={password} />

        <AuthInput
          id="confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
        />

        {confirmPassword.length > 0 && !passwordsMatch && (
          <AuthAlert tone="error" message="Passwords do not match." />
        )}

        <AuthButton loading={loading} disabled={!policy.valid || !passwordsMatch}>
          Update Password
        </AuthButton>
      </form>
    </AuthShell>
  );
}
