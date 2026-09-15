'use client';

import React from 'react';

import { blockNonDigitPhoneKey, sanitizePhoneDigits } from '@/lib/hospital/indian-patient';

type PhoneNumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode' | 'pattern' | 'maxLength'
> & {
  value: string;
  onChange: (value: string) => void;
};

export function PhoneNumberInput({
  value,
  onChange,
  placeholder = 'Enter 10-digit mobile number',
  className,
  ...props
}: PhoneNumberInputProps) {
  return (
    <input
      {...props}
      type="tel"
      inputMode="numeric"
      pattern="[0-9]{10}"
      maxLength={10}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(sanitizePhoneDigits(event.target.value))}
      onKeyDown={blockNonDigitPhoneKey}
      className={className}
    />
  );
}
