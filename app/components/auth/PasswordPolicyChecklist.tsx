'use client';

import React from 'react';

import { evaluatePasswordPolicy } from '../../lib/auth';

type PasswordPolicyChecklistProps = {
  password: string;
};

export default function PasswordPolicyChecklist({ password }: PasswordPolicyChecklistProps) {
  const { checks } = evaluatePasswordPolicy(password);

  const items = [
    { label: 'At least 8 characters', ok: checks.minLength },
    { label: 'Contains a number', ok: checks.hasNumber },
    { label: 'Contains a symbol', ok: checks.hasSymbol },
  ];

  return (
    <ul className="space-y-1.5 rounded-xl border border-[#49769F]/20 bg-[#BDD8E9]/20 p-3">
      {items.map((item) => (
        <li
          key={item.label}
          className={`flex items-center gap-2 text-xs font-semibold ${
            item.ok ? 'text-emerald-700' : 'text-[#49769F]'
          }`}
        >
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${
              item.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-[#49769F]'
            }`}
          >
            {item.ok ? '✓' : '·'}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
