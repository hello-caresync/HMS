'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { InternalStaffRole, StaffPermission } from '../../lib/auth/hospital/types';
import {
  buildInitialPermissionMatrix,
  SEED_EMPLOYEES,
  SHIFT_BLOCKS,
} from '../../lib/staff/seedStaff';
import type {
  CreateStaffDraft,
  HospitalEmployeeProfile,
  RolePermissionMatrix,
  ShiftAllocation,
} from '../../lib/staff/types';

type StaffManagementContextValue = {
  employees: HospitalEmployeeProfile[];
  shiftAllocations: ShiftAllocation[];
  permissionMatrix: RolePermissionMatrix;
  matrixLocked: boolean;
  searchQuery: string;
  filteredEmployees: HospitalEmployeeProfile[];
  drawerOpen: boolean;
  toggleEmployeeActive: (employeeId: string) => void;
  setSearchQuery: (query: string) => void;
  openCreateDrawer: () => void;
  closeCreateDrawer: () => void;
  createEmployee: (draft: CreateStaffDraft) => void;
  toggleMatrixPermission: (role: InternalStaffRole, permissionKey: string) => void;
  unlockMatrix: () => void;
  saveMatrix: () => void;
  getShiftById: (shiftId: string) => ShiftAllocation | undefined;
};

const StaffManagementContext = createContext<StaffManagementContextValue | null>(null);

function generateEmployeeId(existing: HospitalEmployeeProfile[]): string {
  const year = new Date().getFullYear();
  const serial = existing.filter((e) => e.employeeId.includes(String(year))).length + 1;
  return `EMP-${year}-${String(serial).padStart(3, '0')}`;
}

export function StaffManagementProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<HospitalEmployeeProfile[]>(SEED_EMPLOYEES);
  const [shiftAllocations, setShiftAllocations] = useState<ShiftAllocation[]>(SHIFT_BLOCKS);
  const [permissionMatrix, setPermissionMatrix] = useState<RolePermissionMatrix>(
    buildInitialPermissionMatrix,
  );
  const [matrixLocked, setMatrixLocked] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter(
      (emp) =>
        emp.employeeId.toLowerCase().includes(q) ||
        emp.personal.fullName.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.roleCode.toLowerCase().includes(q) ||
        emp.personal.email.toLowerCase().includes(q),
    );
  }, [employees, searchQuery]);

  const toggleEmployeeActive = useCallback((employeeId: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === employeeId
          ? {
              ...emp,
              isActive: !emp.isActive,
              contractStatus: !emp.isActive ? 'active' : 'inactive',
              lastModifiedAt: new Date().toISOString(),
            }
          : emp,
      ),
    );
  }, []);

  const createEmployee = useCallback(
    (draft: CreateStaffDraft) => {
      const employeeId = generateEmployeeId(employees);
      const now = new Date().toISOString();

      const profile: HospitalEmployeeProfile = {
        employeeId,
        personal: {
          fullName: draft.fullName,
          email: draft.email,
          phone: draft.phone,
          governmentId: draft.governmentId,
        },
        contractStatus: 'active',
        isActive: true,
        department: draft.department,
        roleCode: draft.roleCode,
        shiftBlockId: draft.shiftBlockId,
        joinedAt: now,
        lastModifiedAt: now,
      };

      setEmployees((prev) => [profile, ...prev]);
      setShiftAllocations((prev) =>
        prev.map((shift) =>
          shift.shiftId === draft.shiftBlockId
            ? { ...shift, staffIds: [...shift.staffIds, employeeId] }
            : shift,
        ),
      );
      setDrawerOpen(false);
    },
    [employees],
  );

  const toggleMatrixPermission = useCallback(
    (role: InternalStaffRole, permissionKey: string) => {
      if (matrixLocked) return;
      setPermissionMatrix((prev) => ({
        ...prev,
        [role]: {
          ...prev[role],
          [permissionKey]: !prev[role][permissionKey],
        },
      }));
    },
    [matrixLocked],
  );

  const getShiftById = useCallback(
    (shiftId: string) => shiftAllocations.find((s) => s.shiftId === shiftId),
    [shiftAllocations],
  );

  const value = useMemo<StaffManagementContextValue>(
    () => ({
      employees,
      shiftAllocations,
      permissionMatrix,
      matrixLocked,
      searchQuery,
      filteredEmployees,
      drawerOpen,
      toggleEmployeeActive,
      setSearchQuery,
      openCreateDrawer: () => setDrawerOpen(true),
      closeCreateDrawer: () => setDrawerOpen(false),
      createEmployee,
      toggleMatrixPermission,
      unlockMatrix: () => setMatrixLocked(false),
      saveMatrix: () => setMatrixLocked(true),
      getShiftById,
    }),
    [
      employees,
      shiftAllocations,
      permissionMatrix,
      matrixLocked,
      searchQuery,
      filteredEmployees,
      drawerOpen,
      toggleEmployeeActive,
      createEmployee,
      toggleMatrixPermission,
      getShiftById,
    ],
  );

  return (
    <StaffManagementContext.Provider value={value}>{children}</StaffManagementContext.Provider>
  );
}

export function useStaffManagement(): StaffManagementContextValue {
  const ctx = useContext(StaffManagementContext);
  if (!ctx) {
    throw new Error('useStaffManagement must be used within StaffManagementProvider');
  }
  return ctx;
}
