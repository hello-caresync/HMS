'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  mapHospitalStaffAuthRow,
  normalizeCredentialRole,
  type HospitalCredentialRole,
  type HospitalUserCredential,
} from '@/lib/auth/hospitalAuth';
import {
  HOSPITAL_DEPARTMENTS,
  isCustomDepartmentSelection,
  resolveDepartmentValue,
} from '@/lib/hospital/departments';
import { createHospitalStaffMember, type StaffRole } from '@/lib/hospital/staff-directory';
import { validatePhoneField } from '@/lib/hospital/indian-patient';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import { supabase } from '@/lib/supabase';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';

export type StaffProvisionResult = {
  credential: HospitalUserCredential;
  passcode: string;
};

export type StaffProvisionScope = 'operational' | 'hospital-admin';

export const HOSPITAL_ADMIN_DEPARTMENT = 'HOSPITAL ADMINISTRATION';

type StaffProvisioningModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: StaffProvisionResult) => void | Promise<void>;
  hospitalId?: string;
  hospitalName?: string;
  /** Super Admin provisions hospital admins only; hospital admins provision operational staff. */
  provisionScope?: StaffProvisionScope;
};

const ALL_ROLE_OPTIONS: Array<{ label: string; value: string; credentialRole: HospitalCredentialRole }> = [
  { label: 'Doctor', value: 'Doctor', credentialRole: 'doctor' },
  { label: 'Admin', value: 'Admin', credentialRole: 'admin' },
  { label: 'Nurse', value: 'Nurse', credentialRole: 'nurse' },
  { label: 'Receptionist', value: 'Receptionist', credentialRole: 'staff' },
  { label: 'Pharmacist', value: 'Pharmacist', credentialRole: 'staff' },
  { label: 'Billing Desk', value: 'Billing Desk', credentialRole: 'staff' },
];

const OPERATIONAL_ROLE_OPTIONS = ALL_ROLE_OPTIONS.filter((option) =>
  ['Doctor', 'Nurse', 'Receptionist', 'Pharmacist'].includes(option.label),
);

function createInitialForm(scope: StaffProvisionScope) {
  if (scope === 'hospital-admin') {
    return {
      staff_id_code: '',
      full_name: '',
      email: '',
      phone: '',
      passcode_key: '',
      department: HOSPITAL_ADMIN_DEPARTMENT,
      customDepartment: '',
      role: 'Admin',
      consultation_fee: null as number | null,
    };
  }

  return {
    staff_id_code: '',
    full_name: '',
    email: '',
    phone: '',
    passcode_key: '',
    department: 'General Medicine',
    customDepartment: '',
    role: 'Doctor',
    consultation_fee: DEFAULT_DOCTOR_FEE as number | null,
  };
}

const DEFAULT_DOCTOR_FEE = 500;

function isDoctorRoleSelection(
  roleLabel: string,
  roleOptions: Array<{ label: string; value: string; credentialRole: HospitalCredentialRole }>,
): boolean {
  const option = roleOptions.find((entry) => entry.value === roleLabel);
  const credentialRole = option?.credentialRole ?? normalizeCredentialRole(roleLabel);
  return credentialRole === 'doctor';
}

export function StaffProvisioningModal({
  open,
  onClose,
  onSuccess,
  hospitalId = HOSPITAL_TENANT_ID,
  hospitalName = 'Regal Hospital',
  provisionScope = 'operational',
}: StaffProvisioningModalProps) {
  const isHospitalAdminScope = provisionScope === 'hospital-admin';
  const roleOptions = isHospitalAdminScope ? ALL_ROLE_OPTIONS.filter((option) => option.label === 'Admin') : OPERATIONAL_ROLE_OPTIONS;

  const [form, setForm] = useState(() => createInitialForm(provisionScope));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(createInitialForm(provisionScope));
    setError(null);
  }, [open, provisionScope]);

  const isDoctorRole = isDoctorRoleSelection(form.role, roleOptions);

  const handleRoleChange = (nextRole: string) => {
    const doctorSelected = isDoctorRoleSelection(nextRole, roleOptions);
    setForm((prev) => ({
      ...prev,
      role: nextRole,
      department:
        nextRole === 'Pharmacist'
          ? 'Pharmacy'
          : nextRole === 'Receptionist'
            ? 'Front Desk'
            : prev.department,
      consultation_fee: doctorSelected ? prev.consultation_fee ?? DEFAULT_DOCTOR_FEE : null,
    }));
  };

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const lockedRole = isHospitalAdminScope ? 'Admin' : form.role;
      const lockedDepartment = isHospitalAdminScope
        ? HOSPITAL_ADMIN_DEPARTMENT
        : resolveDepartmentValue(form.department, form.customDepartment);

      if (!lockedDepartment) {
        setError('Please enter a custom department name.');
        return;
      }

      const roleOption = roleOptions.find((option) => option.value === lockedRole);
      const credentialRole = roleOption?.credentialRole ?? normalizeCredentialRole(lockedRole);
      const passcode = form.passcode_key.trim();

      const phoneCheck = validatePhoneField(form.phone, !isHospitalAdminScope);
      if (!phoneCheck.ok) {
        toast.error(phoneCheck.message);
        setError(phoneCheck.message);
        return;
      }

      const resolvedHospitalId = hospitalId?.trim() || HOSPITAL_TENANT_ID;
      const staffRole: StaffRole =
        credentialRole === 'admin' ? 'admin' : credentialRole === 'doctor' ? 'doctor' : 'staff';
      const consultationFee = credentialRole === 'doctor'
        ? Math.max(0, Number(form.consultation_fee ?? DEFAULT_DOCTOR_FEE) || DEFAULT_DOCTOR_FEE)
        : null;

      const rosterResult = await createHospitalStaffMember(supabase, resolvedHospitalId, {
        staff_id_code: form.staff_id_code.trim().toUpperCase(),
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        passcode_key: passcode,
        role: staffRole,
        role_label: lockedRole,
        department: lockedDepartment,
        qualification: credentialRole === 'doctor' ? 'MBBS, MD' : '',
        consultation_fee: consultationFee,
        is_active: true,
      });

      if (!rosterResult.ok || !rosterResult.member) {
        throw new Error(rosterResult.error ?? 'Could not save staff credential.');
      }

      const employeeId = rosterResult.member.staff_id_code;
      const credential = mapHospitalStaffAuthRow({
        id: rosterResult.member.id,
        hospital_id: rosterResult.member.hospital_id,
        hospital_name: hospitalName,
        staff_id_code: employeeId,
        full_name: rosterResult.member.full_name,
        email: rosterResult.member.email,
        role: rosterResult.member.role,
        department: rosterResult.member.department,
        passcode_key: passcode,
        is_active: true,
        phone: phoneCheck.phone ?? undefined,
      });

      toast.success(
        isHospitalAdminScope
          ? `${form.full_name.trim()} provisioned as Hospital Admin.`
          : `${form.full_name.trim()} provisioned successfully with ID ${employeeId}!`,
      );
      if (onSuccess) {
        await Promise.resolve(
          onSuccess({ credential, passcode }),
        );
      }
      setForm(createInitialForm(provisionScope));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not provision staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-900">
          {isHospitalAdminScope ? 'Provision Hospital Admin' : 'Provision Staff Credential'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isHospitalAdminScope
            ? 'Platform Root action — creates the single Hospital Admin credential for this tenant node.'
            : 'Hospital Admin action — onboard operational staff scoped to your facility node.'}
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Full Name</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              placeholder={isHospitalAdminScope ? 'e.g. Kavya S' : 'e.g. Dr. Meera Nambiar'}
            />
          </div>

          {isHospitalAdminScope ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-purple-700">Role</p>
                <p className="mt-1 text-xs font-semibold text-slate-900">Admin</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-purple-700">Department</p>
                <p className="mt-1 text-xs font-semibold text-slate-900">{HOSPITAL_ADMIN_DEPARTMENT}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500">Department</label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      department: e.target.value,
                      customDepartment: isCustomDepartmentSelection(e.target.value)
                        ? form.customDepartment
                        : '',
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                >
                  {HOSPITAL_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {isCustomDepartmentSelection(form.department) && (
                  <input
                    type="text"
                    required
                    value={form.customDepartment}
                    onChange={(e) => setForm({ ...form, customDepartment: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-teal-300 bg-teal-50/40 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
                    placeholder="Type custom department name…"
                  />
                )}
              </div>
            </div>
          )}

          <div className={`grid gap-2 ${isDoctorRole && !isHospitalAdminScope ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">
                {isHospitalAdminScope ? 'Admin Email' : 'Email'}
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                placeholder={isHospitalAdminScope ? 'kavyaregaladmin@gmail.com' : undefined}
              />
            </div>
            {isDoctorRole && !isHospitalAdminScope ? (
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500">Fee (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.consultation_fee ?? DEFAULT_DOCTOR_FEE}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      consultation_fee: Number(e.target.value) || DEFAULT_DOCTOR_FEE,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            ) : !isHospitalAdminScope ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                Consultation fees apply to physician profiles only.
              </p>
            ) : null}
          </div>

          {!isHospitalAdminScope ? (
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Phone</label>
              <PhoneNumberInput
                required
                value={form.phone}
                onChange={(phone) => setForm({ ...form, phone })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
          ) : null}

          <div className={isHospitalAdminScope ? 'space-y-2' : 'grid grid-cols-2 gap-2'}>
            {!isHospitalAdminScope ? (
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500">Staff ID (optional)</label>
                <input
                  type="text"
                  value={form.staff_id_code}
                  onChange={(e) => setForm({ ...form, staff_id_code: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                  placeholder="RH-D42"
                />
              </div>
            ) : null}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Security Passcode</label>
              <input
                type="password"
                required
                minLength={4}
                value={form.passcode_key}
                onChange={(e) => setForm({ ...form, passcode_key: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                placeholder={isHospitalAdminScope ? 'REGAL#KAVYA@2026' : 'Used at /hospital/login'}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : isHospitalAdminScope ? 'Provision Admin Access' : 'Save & Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
