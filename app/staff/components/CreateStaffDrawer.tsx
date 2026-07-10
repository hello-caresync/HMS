'use client';

import { useState } from 'react';
import { ShieldAlert, UserPlus, X } from 'lucide-react';

import { INTERNAL_STAFF_ROLES } from '../../lib/auth/hospital/types';
import { ROLE_LABELS } from '../../lib/auth/hospital/permissions';
import { maskGovernmentId } from '../../lib/staff/utils';
import type { CreateStaffDraft } from '../../lib/staff/types';
import { useStaffManagement } from '../context/StaffManagementProvider';

const DEPARTMENT_OPTIONS = [
  'Front Desk · OPD',
  'ICU · Critical Care',
  'Main Pharmacy',
  'Finance & Billing',
  'Central Store',
  'Central Laboratory',
  'Hospital Administration',
  'Information Technology',
];

export default function CreateStaffDrawer() {
  const { drawerOpen, closeCreateDrawer, createEmployee, shiftAllocations } =
    useStaffManagement();

  const [draft, setDraft] = useState<CreateStaffDraft>({
    fullName: '',
    email: '',
    phone: '',
    governmentId: '',
    department: DEPARTMENT_OPTIONS[0],
    roleCode: 'receptionist',
    shiftBlockId: shiftAllocations[0]?.shiftId ?? '',
  });

  if (!drawerOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createEmployee(draft);
    setDraft({
      fullName: '',
      email: '',
      phone: '',
      governmentId: '',
      department: DEPARTMENT_OPTIONS[0],
      roleCode: 'receptionist',
      shiftBlockId: shiftAllocations[0]?.shiftId ?? '',
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={closeCreateDrawer}
        aria-hidden
      />

      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        aria-label="Create new staff member"
      >
        <header className="flex items-center justify-between border-b-2 border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Create New Staff Member</p>
              <p className="text-[11px] text-slate-800">Onboarding shell · HR intake</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCreateDrawer}
            className="rounded-lg p-2 text-slate-800 hover:bg-slate-100"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 p-5">
            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Contact Details
              </p>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-800">Full Name</span>
                <input
                  required
                  value={draft.fullName}
                  onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  placeholder="e.g. Ananya Krishnan"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-800">Work Email</span>
                <input
                  required
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  placeholder="name@nexora.health"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-800">Mobile Number</span>
                <input
                  required
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  placeholder="+91 98765 43210"
                />
              </label>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Government Identification
              </p>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-800">ID Number</span>
                <input
                  required
                  value={draft.governmentId}
                  onChange={(e) => setDraft((d) => ({ ...d, governmentId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  placeholder="AADHAAR / PAN / Employee National ID"
                />
              </label>

              {draft.governmentId.trim() && (
                <p className="font-mono text-[11px] text-slate-800">
                  Masked preview: {maskGovernmentId(draft.governmentId)}
                </p>
              )}

              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Internal masking rules apply: only last 4 characters are displayed in directory
                views. Full identifiers are restricted to HR Admin and audit workflows.
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Assignment
              </p>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-800">Department</span>
                <select
                  value={draft.department}
                  onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-800">Job Role</span>
                <select
                  value={draft.roleCode}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      roleCode: e.target.value as CreateStaffDraft['roleCode'],
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  {INTERNAL_STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-800">Primary Shift Block</span>
                <select
                  required
                  value={draft.shiftBlockId}
                  onChange={(e) => setDraft((d) => ({ ...d, shiftBlockId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  {shiftAllocations.map((shift) => (
                    <option key={shift.shiftId} value={shift.shiftId}>
                      {shift.label} ({shift.startTime}–{shift.endTime})
                    </option>
                  ))}
                </select>
              </label>
            </section>
          </div>

          <footer className="mt-auto border-t border-slate-200 bg-slate-50 px-5 py-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-900"
            >
              Provision Staff Profile
            </button>
          </footer>
        </form>
      </aside>
    </>
  );
}
