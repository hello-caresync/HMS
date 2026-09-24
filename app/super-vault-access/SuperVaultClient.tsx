'use client';

import { useEffect, useLayoutEffect } from 'react';

import { SuperAdminHospitalBlocksDashboard } from '@/app/super-admin/staff-credentials/page';
import { flushQueuedRootLoginSuccess } from '@/lib/auth/super-admin-login-audit';
import {
  persistRootMasterSuperAdminGatewaySession,
  SUPER_ADMIN_FACILITY_NODE,
  SUPER_ADMIN_ROOT_EMAIL,
} from '@/lib/auth/superAdminAuth';

function ensureRootVaultSession(): void {
  persistRootMasterSuperAdminGatewaySession(SUPER_ADMIN_ROOT_EMAIL);

  const rootSession = {
    id: 'SUPER-ADMIN-ROOT',
    email: SUPER_ADMIN_ROOT_EMAIL,
    role: 'super_admin',
    name: 'Platform Root Super Admin',
    facility_node: SUPER_ADMIN_FACILITY_NODE,
    accessLevel: 'level_0_root',
    authenticated_at: new Date().toISOString(),
  };

  const serialized = JSON.stringify(rootSession);
  localStorage.setItem('super_admin_session', serialized);
  localStorage.setItem('platform_root_unlocked', 'true');
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('userRole', 'SUPER_ADMIN');
}

export default function SuperVaultClient() {
  useLayoutEffect(() => {
    ensureRootVaultSession();
  }, []);

  useEffect(() => {
    void flushQueuedRootLoginSuccess();
  }, []);

  return <SuperAdminHospitalBlocksDashboard excludeGlobalSuperAdminFromRoster />;
}
