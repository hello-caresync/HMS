import type { PasswordPolicyResult } from './types';

const MIN_LENGTH = 8;
const NUMBER_PATTERN = /\d/;
const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

export function evaluatePasswordPolicy(password: string): PasswordPolicyResult {
  const checks = {
    minLength: password.length >= MIN_LENGTH,
    hasNumber: NUMBER_PATTERN.test(password),
    hasSymbol: SYMBOL_PATTERN.test(password),
  };

  return {
    valid: checks.minLength && checks.hasNumber && checks.hasSymbol,
    checks,
  };
}

export const PASSWORD_POLICY_HINT =
  'Minimum 8 characters with at least one number and one symbol.';
