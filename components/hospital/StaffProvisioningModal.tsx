'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

import {
  normalizeCredentialRole,
  upsertHospitalUserCredential,
  type HospitalCredentialRole,
  type HospitalUserCredential,
} from '@/lib/auth/hospitalAuth';
import {
  HOSPITAL_DEPARTMENTS,
  isCustomDepartmentSelection,
  resolveDepartmentValue,
} from '@/lib/hospital/departments';
import { upsertBookableDoctor } from '@/lib/hospital/doctors-directory';
import { createHospitalStaffMember, type StaffRole } from '@/lib/hospital/staff-directory';
import { validatePhoneField } from '@/lib/hospital/indian-patient';
import { requireHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import { supabase } from '@/lib/supabase';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';

export type StaffProvisionResult = {
  credential: HospitalUserCredential;
  passcode: string;
};

type StaffProvisioningModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: StaffProvisionResult) => void | Promise<void>;
  hospitalId?: string;
  hospitalName?: string;
};

const ROLE_OPTIONS: Array<{ label: string; value: string; credentialRole: HospitalCredentialRole }> = [
  { label: 'Doctor', value: 'Doctor', credentialRole: 'doctor' },
  { label: 'Nurse', value: 'Nurse', credentialRole: 'nurse' },
  { label: 'Billing Desk', value: 'Billing Desk', credentialRole: 'staff' },
  { label: 'Receptionist', value: 'Receptionist', credentialRole: 'staff' },
  { label: 'Admin', value: 'Admin', credentialRole: 'admin' },
];

const DEFAULT_DOCTOR_FEE = 500;

function isDoctorRoleSelection(roleLabel: string): boolean {
  const option = ROLE_OPTIONS.find((entry) => entry.value === roleLabel);
  const credentialRole = option?.credentialRole ?? normalizeCredentialRole(roleLabel);
  return credentialRole === 'doctor';
}

export function StaffProvisioningModal({
  open,
  onClose,
  onSuccess,
  hospitalId = HOSPITAL_TENANT_ID,
  hospitalName = 'Regal Hospital',
}: StaffProvisioningModalProps) {
  const [form, setForm] = useState({
    staff_id_code: '',
    full_name: '',
    email: '',
    phone: '',
    passcode_key: '',
    department: 'General Medicine',
    customDepartment: '',
    role: 'Doctor',
    consultation_fee: DEFAULT_DOCTOR_FEE as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDoctorRole = isDoctorRoleSelection(form.role);

  const handleRoleChange = (nextRole: string) => {
    const doctorSelected = isDoctorRoleSelection(nextRole);
    setForm((prev) => ({
      ...prev,
      role: nextRole,
      consultation_fee: doctorSelected ? prev.consultation_fee ?? DEFAULT_DOCTOR_FEE : null,
    }));
  };

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const department = resolveDepartmentValue(form.department, form.customDepartment);
      if (!department) {
        setError('Please enter a custom department name.');
        return;
      }

      const roleOption = ROLE_OPTIONS.find((option) => option.value === form.role);
      const credentialRole = roleOption?.credentialRole ?? normalizeCredentialRole(form.role);
      const passcode = form.passcode_key.trim();
      const phoneCheck = validatePhoneField(form.phone, true);
      if (!phoneCheck.ok) {
        toast.error(phoneCheck.message);
        setError(phoneCheck.message);
        return;
      }

      const resolvedHospitalId = await requireHospitalUuid(supabase, hospitalId);
      const rawEmployeeCode = form.staff_id_code.trim().toUpperCase() || undefined;

      const credentialResult = await upsertHospitalUserCredential(supabase, {
        hospital_id: resolvedHospitalId,
        hospital_name: hospitalName,
        employee_id: rawEmployeeCode,
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        role: credentialRole,
        department,
        passcode,
        phone: phoneCheck.phone ?? undefined,
        portal_access: credentialRole === 'doctor' ? '/doctor/dashboard' : '/dashboard',
      });

      if (!credentialResult.ok || !credentialResult.credential) {
        throw new Error(credentialResult.error ?? 'Could not save portal credential.');
      }

      const staffRole: StaffRole =
        credentialRole === 'admin' ? 'admin' : credentialRole === 'doctor' ? 'doctor' : 'staff';

      const employeeId = credentialResult.credential.employee_id;
      const consultationFee = credentialRole === 'doctor'
        ? Math.max(0, Number(form.consultation_fee ?? DEFAULT_DOCTOR_FEE) || DEFAULT_DOCTOR_FEE)
        : null;

      const rosterResult = await createHospitalStaffMember(supabase, resolvedHospitalId, {
        staff_id_code: employeeId,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        passcode_key: passcode,
        role: staffRole,
        department,
        qualification: credentialRole === 'doctor' ? 'MBBS, MD' : '',
        consultation_fee: consultationFee,
        is_active: true,
      });

      if (!rosterResult.ok) {
        console.warn('Roster sync skipped:', rosterResult.error);
      }

      if (credentialRole === 'doctor') {
        const doctorSync = await upsertBookableDoctor(supabase, resolvedHospitalId, {
          staff_id_code: employeeId,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: phoneCheck.phone ?? undefined,
          department,
          specialization: department || 'Consultant Physician',
          qualification: 'MBBS, MD',
          consultation_fee: consultationFee ?? DEFAULT_DOCTOR_FEE,
          hospital_name: hospitalName,
        });
        if (!doctorSync.ok) {
          console.warn('Doctor table sync warning:', doctorSync.error);
        }
      }

      toast.success(
        `${form.full_name.trim()} provisioned successfully with ID ${employeeId}!`,
      );
      if (onSuccess) {
        await Promise.resolve(
          onSuccess({ credential: credentialResult.credential, passcode }),
        );
      }
      setForm({
        staff_id_code: '',
        full_name: '',
        email: '',
        phone: '',
        passcode_key: '',
        department: 'General Medicine',
        customDepartment: '',
        role: 'Doctor',
        consultation_fee: DEFAULT_DOCTOR_FEE,
      });
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
        <h2 className="text-base font-bold text-slate-900">Provision Hospital Personnel</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Writes login credentials to <code className="font-mono text-[10px]">hospital_user_credentials</code>,
          syncs the staff roster, and publishes doctors to <code className="font-mono text-[10px]">public.doctors</code>{' '}
          for patient booking.
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Legal Full Name</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              placeholder="e.g. Dr. Meera Nambiar"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Role</label>
              <select
                value={form.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                {ROLE_OPTIONS.map((option) => (
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

          <div className={`grid gap-2 ${isDoctorRole ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            {isDoctorRole ? (
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
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                Consultation fees apply to physician profiles only.
              </p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Phone</label>
            <PhoneNumberInput
              required
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
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
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Security Passcode</label>
              <input
                type="password"
                required
                minLength={4}
                value={form.passcode_key}
                onChange={(e) => setForm({ ...form, passcode_key: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                placeholder="Used at /hospital/login"
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
              {submitting ? 'Saving…' : 'Save & Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
