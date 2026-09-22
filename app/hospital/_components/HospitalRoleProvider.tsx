'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

import { readHospitalAppSession, type StaffPortalSession } from '@/lib/auth/ecosystem-sessions';
import {
  canManageStaffCredentials,
  isHospitalCredentialAdmin,
  normalizeHospitalRole,
  resolveHospitalSessionRole,
} from '@/lib/auth/hospital-rbac';

export type HospitalRoleContextValue = {
  session: StaffPortalSession | null;
  userRole: string;
  isAdmin: boolean;
  canManageStaffCredentials: boolean;
  refreshRole: () => void;
};

const HospitalRoleContext = createContext<HospitalRoleContextValue | null>(null);

export function HospitalRoleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<StaffPortalSession | null>(null);

  const refreshRole = useCallback(() => {
    setSession(readHospitalAppSession());
  }, []);

  useEffect(() => {
    refreshRole();
  }, [pathname, refreshRole]);

  const value = useMemo<HospitalRoleContextValue>(() => {
    const userRole = resolveHospitalSessionRole(session);
    const normalizedRole = normalizeHospitalRole(userRole);
    const isAdmin = isHospitalCredentialAdmin(userRole);
    return {
      session,
      userRole: normalizedRole,
      isAdmin,
      canManageStaffCredentials: canManageStaffCredentials(session),
      refreshRole,
    };
  }, [session, refreshRole]);

  return <HospitalRoleContext.Provider value={value}>{children}</HospitalRoleContext.Provider>;
}

export function useHospitalRole(): HospitalRoleContextValue {
  const context = useContext(HospitalRoleContext);
  if (!context) {
    return {
      session: null,
      userRole: 'STAFF',
      isAdmin: false,
      canManageStaffCredentials: false,
      refreshRole: () => {},
    };
  }
  return context;
}
