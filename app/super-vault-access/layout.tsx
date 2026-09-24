'use client';

import type { ReactNode } from 'react';

/** Vault is root-gated in-app; middleware treats /super-vault-access as a public auth route. */
export default function SuperVaultAccessLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
