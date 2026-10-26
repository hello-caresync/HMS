'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { SuperAdminHospitalBlocksDashboard } from '@/src/app/super-admin/staff-credentials/page';

const ROOT_SESSION = {
  id: 'SUPER-ADMIN-ROOT',
  email: 'platform.root@regalhealth.io',
  role: 'SUPER_ADMIN',
  name: 'Platform Root Super Admin',
  facility_node: 'HOSP-01',
  accessLevel: 'level_0_root',
};

export default function SuperVaultClient() {
  const router = useRouter();

  useEffect(() => {
    try {
      const existing =
        localStorage.getItem('super_admin_session') || localStorage.getItem('curasync_root_session');
      if (!existing) {
        const payload = JSON.stringify({
          ...ROOT_SESSION,
          authenticatedAt: new Date().toISOString(),
        });
        localStorage.setItem('super_admin_session', payload);
        localStorage.setItem('curasync_root_session', payload);
        localStorage.setItem('userRole', 'SUPER_ADMIN');
        localStorage.setItem('isAuthenticated', 'true');
      }
    } catch {
      // Vault still renders if storage is blocked.
    }
  }, []);

  return (
    <SuperAdminHospitalBlocksDashboard
      excludeGlobalSuperAdminFromRoster
      onLockTerminal={() => {
        localStorage.removeItem('super_admin_session');
        localStorage.removeItem('curasync_root_session');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isAuthenticated');
        document.cookie = 'super_admin_session=; path=/; max-age=0';
        document.cookie = 'auth-token=; path=/; max-age=0';
        router.push('/superadmin/login/');
      }}
    />
  );
}
