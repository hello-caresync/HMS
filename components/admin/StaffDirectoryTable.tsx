'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Copy, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { isGlobalSuperAdminStaffRecord } from '@/lib/auth/superAdminAuth';
import {
  deleteHospitalStaffCredential,
  type HospitalStaffMember,
} from '@/lib/hospital/staff-directory';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function badgeRole(member: HospitalStaffMember): string {
  const raw = String(member.raw_role ?? member.role ?? 'staff').trim();
  return raw.replace(/\s+/g, '_').toUpperCase();
}

function badgeClass(role: string): string {
  if (role.includes('VENDOR')) return 'bg-violet-100 text-violet-700';
  if (role.includes('DOCTOR') || role.includes('CLINIC')) return 'bg-emerald-100 text-emerald-700';
  if (role.includes('ADMIN')) return 'bg-amber-100 text-amber-800';
  if (role.includes('NURSE')) return 'bg-sky-100 text-sky-800';
  return 'bg-slate-100 text-slate-600';
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
  onEdit,
}: StaffDirectoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visiblePasscodes, setVisiblePasscodes] = useState<Record<string, boolean>>({});

  const copyText = (value: string, label: string) => {
    void navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error(`Could not copy ${label.toLowerCase()}`),
    );
  };

  const handleDeleteStaff = async (member: HospitalStaffMember) => {
    const staffId = member.id || member.staff_id_code;
    const staffCode = member.staff_id_code || member.id;
    const memberName = member.full_name || 'this staff member';

    if (
      isGlobalSuperAdminStaffRecord({
        email: member.email,
        role: member.raw_role || member.role,
      }) ||
      /platform root/i.test(memberName)
    ) {
      alert('This login stays in the super admin vault. It is not removed from the hospital roster.');
      return;
    }

    const confirmed = window.confirm(`Remove the login for ${memberName} (${staffCode})?`);
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
    <div className="w-full overflow-x-hidden">
      <table className="w-full table-fixed text-left text-[11px]">
        <colgroup>
          <col className="w-[13%]" />
          <col className="w-[14%]" />
          <col className="w-[7%]" />
          <col className="w-[14%]" />
          <col className="w-[12%]" />
          <col className="w-[16%]" />
          <col className="w-[14%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-2 py-2">Name &amp; Role</th>
            <th className="px-2 py-2">Department / Specialization</th>
            <th className="px-2 py-2">Experience</th>
            <th className="px-2 py-2">Timings</th>
            <th className="px-2 py-2">Qualifications</th>
            <th className="px-2 py-2">Email</th>
            <th className="px-2 py-2">Passcode</th>
            <th className="px-2 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {staffList.map((member) => {
            const identifier = staffIdentifier(member);
            const isDeleting = deletingId === identifier;
            const role = badgeRole(member);
            const passcode = member.passcode_key.trim();
            const email = member.email.trim();
            const passcodeVisible = Boolean(visiblePasscodes[identifier]);
            const department = member.department?.trim() || '';
            const specialization = member.specialization?.trim() || '';
            const showSpecialization =
              specialization && specialization.toLowerCase() !== department.toLowerCase();

            return (
              <tr key={member.id || member.staff_id_code || member.email} className="align-top">
                <td className="break-words px-2 py-2.5">
                  <div className="font-bold text-slate-900">{member.full_name}</div>
                  <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-black tracking-wide ${badgeClass(role)}`}>
                    {role}
                  </span>
                </td>
                <td className="break-words px-2 py-2.5">
                  <div className="font-semibold text-slate-800">{department || '—'}</div>
                  {showSpecialization ? (
                    <div className="mt-0.5 text-[10px] text-slate-500">{specialization}</div>
                  ) : null}
                </td>
                <td className="break-words px-2 py-2.5 text-slate-600">{member.experience?.trim() || '—'}</td>
                <td className="break-words px-2 py-2.5 text-slate-600">
                  {member.timings?.trim() || 'On Appointment'}
                </td>
                <td className="break-words px-2 py-2.5 text-slate-700">{member.qualification?.trim() || '—'}</td>
                <td className="px-2 py-2.5 text-slate-600">
                  <div className="flex items-start gap-1">
                    <span className="min-w-0 break-all">{email || '—'}</span>
                    {email ? (
                      <button
                        type="button"
                        title="Copy email"
                        onClick={() => copyText(email, 'Email')}
                        className="shrink-0 rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-start gap-1">
                    <span
                      className={`min-w-0 break-all rounded-md bg-violet-50 px-1.5 py-1 font-mono text-[10px] ${
                        passcodeVisible ? 'text-violet-900' : 'tracking-widest text-violet-300'
                      }`}
                    >
                      {passcode ? (passcodeVisible ? passcode : '••••') : '—'}
                    </span>
                    {passcode ? (
                      <>
                        <button
                          type="button"
                          title={passcodeVisible ? 'Hide password' : 'Show password'}
                          onClick={() =>
                            setVisiblePasscodes((current) => ({
                              ...current,
                              [identifier]: !current[identifier],
                            }))
                          }
                          className="shrink-0 rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                        >
                          {passcodeVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          title="Copy password"
                          onClick={() => copyText(passcode, 'Password')}
                          className="shrink-0 rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
                <td className="px-2 py-2.5 text-right">
                  <div className="flex flex-col items-end gap-1">
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(member)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteStaff(member);
                      }}
                      disabled={!identifier || isDeleting}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className={`h-3 w-3 ${isDeleting ? 'animate-pulse' : ''}`} />
                      Delete
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
