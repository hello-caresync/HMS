'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import SuperAdminStaffCredentialsPage from '@/app/super-admin/staff-credentials/page';
import { SUPER_ADMIN_ROOT_EMAIL } from '@/lib/auth/superAdminAuth';

import { SuperAdminVaultGate } from './SuperAdminVaultGate';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function sessionContainsRootEmail(raw: string | null): boolean {
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as { email?: string };
    return (
      String(parsed?.email ?? '')
        .trim()
        .toLowerCase() === SUPER_ADMIN_ROOT_EMAIL
    );
  } catch {
    return raw.toLowerCase().includes(SUPER_ADMIN_ROOT_EMAIL);
  }
}

/** Detect platform root super admin from cookies or localStorage. */
export function detectPlatformRootSuperAdminSession(): boolean {
  if (typeof window === 'undefined') return false;

  if (readCookie('platform_root') === 'true') return true;
  if (localStorage.getItem('platform_root_unlocked') === 'true') return true;
  if (sessionContainsRootEmail(readCookie('super_admin_session'))) return true;
  if (sessionContainsRootEmail(localStorage.getItem('super_admin_session'))) return true;

  return false;
}

export default function SuperVaultClient() {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setIsUnlocked(detectPlatformRootSuperAdminSession());
  }, []);

  if (isUnlocked === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A13]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!isUnlocked) {
    return <SuperAdminVaultGate onUnlock={() => setIsUnlocked(true)} />;
  }

  return <SuperAdminStaffCredentialsPage />;
}
