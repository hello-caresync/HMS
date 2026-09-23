'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { IndianRupee, Pencil, Trash2 } from 'lucide-react';

import {
  classifyGovernancePersonnelRole,
  governanceRoleDisplayLabel,
} from '@/lib/hospital/governance-directory';
import { formatConsultationFee } from '@/lib/hospital/hospital-staff-roster';
import {
  deleteHospitalStaffCredential,
  type HospitalStaffMember,
  type StaffRole,
} from '@/lib/hospital/staff-directory';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function roleLabel(role: StaffRole): string {
  if (role === 'admin') return 'Admin';
  if (role === 'staff') return 'Staff';
  return 'Doctor';
}

function memberRoleLabel(member: HospitalStaffMember): string {
  if (member.raw_role) {
    return governanceRoleDisplayLabel(
      classifyGovernancePersonnelRole(member.raw_role),
      member.raw_role,
    );
  }
  return roleLabel(member.role);
}

function staffIdentifier(member: HospitalStaffMember): string {
  return member.id || member.staff_id_code || member.staff_record_id || '';
}

export type StaffDirectoryTableProps = {
  staffList: HospitalStaffMember[];
  setStaffList: React.Dispatch<React.SetStateAction<HospitalStaffMember[]>>;
  hospitalId: string;
  canManage?: boolean;
  onEdit?: (member: HospitalStaffMember) => void;
};

export function StaffDirectoryTable({
  staffList,
  setStaffList,
  hospitalId,
  canManage = false,
  onEdit,
}: StaffDirectoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteStaff = async (member: HospitalStaffMember) => {
    const staffId = member.id || member.staff_id_code;
    const staffCode = member.staff_id_code || member.id;
    const memberName = member.full_name || 'this staff member';

    const confirmed = window.confirm(
      `PERMANENT DELETION WARNING:\n\nAre you sure you want to permanently delete credentials and records for ${memberName} (${staffCode})?\n\nThis will revoke workspace access and purge linked records immediately. This action cannot be undone.`,
    );
    if (!confirmed) return;

    if (!supabase) {
      alert('Deletion failed: Supabase is not configured.');
      return;
    }

    setDeletingId(staffIdentifier(member));

    try {
      const result = await deleteHospitalStaffCredential(supabase, hospitalId, member);
      if (!result.ok) {
        throw new Error(result.error ?? 'Failed to delete credential');
      }

      setStaffList((prev) =>
        prev.filter(
          (item) =>
            (item.id || item.staff_id_code) !== staffId &&
            (item.id || item.staff_id_code) !== staffCode &&
            item.email !== member.email,
        ),
      );

      alert(`Successfully and permanently deleted credentials for ${memberName}.`);
    } catch (err: unknown) {
      console.error('Permanent deletion failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to permanently delete: ${message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (staffList.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Staff Member &amp; ID</th>
            <th className="px-4 py-3">Role / Department</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Consultation Fee</th>
            <th className="px-4 py-3">Status</th>
            <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {staffList.map((member) => {
            const identifier = staffIdentifier(member);
            const isDeleting = deletingId === identifier;

            return (
              <tr key={member.id || member.staff_id_code}>
                <td className="px-4 py-3.5 font-bold">
                  <span className="mr-2 rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700">
                    {member.staff_id_code || member.id.slice(0, 8)}
                  </span>
                  {member.full_name}
                  {member.qualification ? (
                    <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                      {member.qualification}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3.5">
                  {member.department || '—'} ({memberRoleLabel(member)})
                </td>
                <td className="px-4 py-3.5 font-mono">{member.email || '—'}</td>
                <td className="px-4 py-3.5">
                  {member.role === 'doctor' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                      <IndianRupee className="h-3 w-3 text-cyan-700" />
                      {formatConsultationFee(member.consultation_fee ?? 500)}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      member.is_active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 px-4 text-right">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    {canManage && onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(member)}
                        disabled={isDeleting}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={`Edit ${member.full_name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteStaff(member);
                      }}
                      disabled={!identifier || isDeleting}
                      className="inline-flex items-center justify-center rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50"
                      title={`Delete ${member.full_name || 'credential'}`}
                    >
                      <Trash2 className={`h-4 w-4 ${isDeleting ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
