'use client';

import React from 'react';

import { HospitalUser, RolePermissions, UserRole } from '../types/procurement';
import {
  alertWarningClassName,
  bodyTextClassName,
  featureHeaderClassName,
  monoDataClassName,
  PageHeader,
  panelClassName,
  StatusBadge,
  workspaceClassName,
} from './hospitalUi';

type AccessControlViewProps = {
  users: HospitalUser[];
  currentRole: UserRole;
  permissions: RolePermissions;
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'System Administrator',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  FINANCE_TEAM: 'Finance Controller',
  STORE_MANAGER: 'Store Manager',
  DEPARTMENT_STAFF: 'Department Staff',
};

export default function AccessControlView({
  users,
  currentRole,
  permissions,
}: AccessControlViewProps) {
  if (!permissions.canManageAccess) {
    return (
      <div className={workspaceClassName}>
        <p className={alertWarningClassName}>
          RBAC matrix is read-only. Only ADMIN may modify enterprise access policies.
        </p>
      </div>
    );
  }

  return (
    <div className={workspaceClassName}>
      <PageHeader
        overline="Enterprise security"
        title="Role-Based Access Control Matrix"
        description={`Simulated enterprise permissions for ${ROLE_LABELS[currentRole]}.`}
      />

      {users.map((user) => (
        <article
          key={user.id}
          className={`${panelClassName} flex flex-wrap items-center justify-between gap-4`}
        >
          <div>
            <h4 className={featureHeaderClassName}>{user.name}</h4>
            <p className={bodyTextClassName}>{user.email}</p>
            <p className={`mt-1 text-[10px] ${monoDataClassName} text-slate-800`}>
              Dept {user.departmentId}
            </p>
          </div>
          <StatusBadge label={ROLE_LABELS[user.role]} />
        </article>
      ))}
    </div>
  );
}
