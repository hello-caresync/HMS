'use client';

import React from 'react';
import { AlertTriangle, Check, Lock, Save, Unlock, X } from 'lucide-react';

import type { InternalStaffRole } from '../../lib/auth/hospital/types';
import {
  getMatrixRoleLabel,
  MATRIX_ROLE_CODES,
} from '../../lib/staff/seedStaff';
import {
  MATRIX_PERMISSION_DEFINITIONS,
  PERMISSION_CATEGORIES,
} from '../../lib/staff/types';
import { useStaffManagement } from '../context/StaffManagementProvider';

function MatrixCheckbox({
  checked,
  disabled,
  sensitive,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  sensitive?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      aria-label={label}
      aria-pressed={checked}
      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition ${
        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-105'
      } ${
        checked
          ? sensitive
            ? 'border-rose-400 bg-rose-500 text-white shadow-sm'
            : 'border-sky-500 bg-sky-600 text-white shadow-sm'
          : 'border-slate-200 bg-white text-transparent hover:border-slate-300'
      }`}
    >
      {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3 w-3" />}
    </button>
  );
}

export default function RbacPermissionMatrix() {
  const {
    permissionMatrix,
    matrixLocked,
    toggleMatrixPermission,
    unlockMatrix,
    saveMatrix,
  } = useStaffManagement();

  const displayRoles = MATRIX_ROLE_CODES;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Interactive RBAC Matrix
          </p>
          <p className="text-sm font-bold text-slate-800">
            Role-permission intersections · grouped by operational category
          </p>
        </div>

        <div className="flex items-center gap-2">
          {matrixLocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 ring-1 ring-slate-200">
              <Lock className="h-3 w-3" />
              Enforced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
              <Unlock className="h-3 w-3" />
              Editing
            </span>
          )}

          {matrixLocked ? (
            <button
              type="button"
              onClick={unlockMatrix}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50"
            >
              Unlock Matrix
            </button>
          ) : (
            <button
              type="button"
              onClick={saveMatrix}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900"
            >
              <Save className="h-3.5 w-3.5" />
              Save Policies
            </button>
          )}
        </div>
      </div>

      {!matrixLocked && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Matrix unlocked. Sensitive permissions are highlighted in rose. Save to enforce across
          the ERP.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-gradient-to-b from-slate-100 to-slate-50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
                <th className="sticky left-0 z-20 min-w-[220px] border-r border-slate-600 bg-slate-800 px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                  Permission / Role
                </th>
                {displayRoles.map((role) => (
                  <th
                    key={role}
                    className="min-w-[100px] px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider"
                  >
                    {getMatrixRoleLabel(role)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {PERMISSION_CATEGORIES.map((category) => {
                const categoryPerms = MATRIX_PERMISSION_DEFINITIONS.filter(
                  (p) => p.category === category.id,
                );

                return (
                  <React.Fragment key={category.id}>
                    <tr className="bg-sky-950/90">
                      <td
                        colSpan={displayRoles.length + 1}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-100"
                      >
                        {category.label}
                      </td>
                    </tr>

                    {categoryPerms.map((perm, rowIndex) => (
                      <tr
                        key={perm.key}
                        className={`border-b-2 border-slate-200 ${
                          rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'
                        }`}
                      >
                        <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-4 py-2.5">
                          <p
                            className={`text-xs font-semibold ${
                              perm.sensitive ? 'text-rose-700' : 'text-slate-800'
                            }`}
                          >
                            {perm.label}
                          </p>
                          {perm.sensitive && (
                            <p className="text-[9px] font-bold uppercase tracking-wide text-rose-500">
                              Sensitive
                            </p>
                          )}
                        </td>

                        {displayRoles.map((role) => {
                          const checked = permissionMatrix[role as InternalStaffRole]?.[perm.key] ?? false;
                          return (
                            <td key={`${perm.key}-${role}`} className="px-3 py-2.5 text-center">
                              <MatrixCheckbox
                                checked={checked}
                                disabled={matrixLocked}
                                sensitive={perm.sensitive}
                                onChange={() =>
                                  toggleMatrixPermission(role as InternalStaffRole, perm.key)
                                }
                                label={`${perm.label} for ${getMatrixRoleLabel(role)}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-800">
        Matrix columns reflect Phase 1 operational roles. Additional roles (Lab Tech, IT Admin,
        etc.) are managed via the full IAM configuration in Settings.
      </p>
    </div>
  );
}
