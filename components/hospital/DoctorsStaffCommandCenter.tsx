'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { HeartHandshake, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import { StaffDirectoryTable } from '@/components/admin/StaffDirectoryTable';
import {
  ensureStaffPasscodeKey,
  generateSecurePasscode,
  passcodePrefixForStaffRole,
} from '@/lib/hospital/generate-secure-passcode';
import {
  createHospitalStaffMember,
  fetchCommandCenterPersonnel,
  toDashboardStaffRow,
  updateHospitalStaffMember,
  type HospitalStaffMember,
  type StaffDirectoryDraft,
  type StaffRole,
} from '@/lib/hospital/staff-directory';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type RoleFilter = 'all' | StaffRole;

const EMPTY_DRAFT: StaffDirectoryDraft = {
  staff_id_code: '',
  full_name: '',
  email: '',
  passcode_key: '',
  role: 'doctor',
  department: '',
  qualification: '',
  consultation_fee: 500,
  is_active: true,
};

function roleLabel(role: StaffRole): string {
  if (role === 'admin') return 'Admin';
  if (role === 'staff') return 'Staff';
  return 'Doctor';
}

function staffRecordId(member: HospitalStaffMember): string | null {
  return member.staff_record_id ?? member.id ?? null;
}

function roleKey(member: HospitalStaffMember): string {
  return String(member.raw_role ?? member.role ?? '')
    .trim()
    .toLowerCase();
}

function isDoctorMember(member: HospitalStaffMember): boolean {
  return roleKey(member) === 'doctor';
}

function isAdminMember(member: HospitalStaffMember): boolean {
  return roleKey(member) === 'admin';
}

function isOperationalStaffMember(member: HospitalStaffMember): boolean {
  return ['nurse', 'staff', 'receptionist', 'pharmacist', 'admin'].includes(roleKey(member));
}

function matchesStaffTabMember(member: HospitalStaffMember): boolean {
  return ['nurse', 'staff', 'receptionist', 'pharmacist'].includes(roleKey(member));
}

export function DoctorsStaffCommandCenter({
  hospitalId,
  hospitalName,
  canManage,
  onRosterChanged,
}: {
  hospitalId: string;
  hospitalName: string;
  canManage: boolean;
  onRosterChanged?: (rows: ReturnType<typeof toDashboardStaffRow>[]) => void;
}) {
  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [members, setMembers] = useState<HospitalStaffMember[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [editor, setEditor] = useState<HospitalStaffMember | 'create' | null>(null);
  const [draft, setDraft] = useState<StaffDirectoryDraft>(EMPTY_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const onRosterChangedRef = useRef(onRosterChanged);

  useEffect(() => {
    onRosterChangedRef.current = onRosterChanged;
  }, [onRosterChanged]);

  useEffect(() => {
    onRosterChangedRef.current?.(members.map(toDashboardStaffRow));
  }, [members]);

  const fetchHospitalStaffDirectory = useCallback(
    async (silent = false) => {
      if (!supabase) return;
      if (!silent) setIsRefreshing(true);
      try {
        const rows = await fetchCommandCenterPersonnel(supabase, nodeId);
        setMembers(rows);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Unable to load staff directory');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [nodeId],
  );

  useEffect(() => {
    void fetchHospitalStaffDirectory();
  }, [fetchHospitalStaffDirectory]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`command_center_directory_${nodeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_user_credentials' },
        () => void fetchHospitalStaffDirectory(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_staff' },
        () => void fetchHospitalStaffDirectory(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        () => void fetchHospitalStaffDirectory(true),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchHospitalStaffDirectory, nodeId]);

  const counts = useMemo(() => {
    const active = members.filter((row) => row.is_active);
    return {
      all: active.length,
      doctor: active.filter(isDoctorMember).length,
      staff: active.filter(matchesStaffTabMember).length,
      admin: active.filter(isAdminMember).length,
      activeDoctors: active.filter(isDoctorMember).length,
      operationalStaff: active.filter(isOperationalStaffMember).length,
    };
  }, [members]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((row) => {
      if (roleFilter === 'doctor' && !isDoctorMember(row)) return false;
      if (roleFilter === 'staff' && !matchesStaffTabMember(row)) return false;
      if (roleFilter === 'admin' && !isAdminMember(row)) return false;
      if (roleFilter !== 'all' && roleFilter !== 'doctor' && roleFilter !== 'staff' && roleFilter !== 'admin') {
        return false;
      }
      if (!needle) return true;
      return (
        row.full_name.toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle) ||
        row.department.toLowerCase().includes(needle) ||
        row.staff_id_code.toLowerCase().includes(needle)
      );
    });
  }, [members, query, roleFilter]);

  const openCreate = () => {
    setDraft({
      ...EMPTY_DRAFT,
      consultation_fee: 500,
      role: 'doctor',
      passcode_key: generateSecurePasscode('DOC'),
    });
    setEditor('create');
  };

  const openEdit = (member: HospitalStaffMember) => {
    setDraft({
      staff_id_code: member.staff_id_code,
      full_name: member.full_name,
      email: member.email,
      passcode_key: ensureStaffPasscodeKey(member.role, member.passcode_key),
      role: member.role,
      department: member.department,
      qualification: member.qualification,
      consultation_fee: member.consultation_fee,
      is_active: member.is_active,
    });
    setEditor(member);
  };

  useEffect(() => {
    if (!editor) return;
    setDraft((prev) => {
      if (prev.passcode_key?.trim()) return prev;
      return {
        ...prev,
        passcode_key: generateSecurePasscode(passcodePrefixForStaffRole(prev.role)),
      };
    });
  }, [editor]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || isSaving) return;
    setIsSaving(true);
    try {
      const recordId = editor && editor !== 'create' ? staffRecordId(editor) : null;
      if (editor && editor !== 'create' && !recordId) {
        toast.error('No linked hospital_staff record — provision this account from the Staff Credentials Vault.');
        return;
      }

      const result =
        editor && editor !== 'create' && recordId
          ? await updateHospitalStaffMember(supabase, nodeId, recordId, draft)
          : await createHospitalStaffMember(supabase, nodeId, draft);
      if (!result.ok) {
        toast.error(result.error || 'Could not save staff record');
        return;
      }
      toast.success(editor === 'create' ? `${draft.full_name} added to the directory` : `${draft.full_name} updated`);
      setEditor(null);
      await fetchHospitalStaffDirectory(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-xs font-bold text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-700" />
        Loading Doctors &amp; Staff…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Doctors &amp; Staff Command Center · Node: {nodeId} ({hospitalName})
          </div>
          <h3 className="mt-1 text-lg font-black text-slate-900">Doctors &amp; Staff Directory</h3>
          <p className="text-xs text-slate-500">
            Live roster synced to Patient Booking. Doctor fees appear in the booking app immediately.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchHospitalStaffDirectory()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Staff / Doctor
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setRoleFilter('doctor')}
          className={`rounded-2xl border bg-white p-5 text-left ${roleFilter === 'doctor' ? 'border-cyan-600 ring-2 ring-cyan-100' : 'border-slate-200'}`}
        >
          <div className="font-mono text-[11px] font-bold uppercase text-slate-400">Active Doctors</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{counts.activeDoctors}</div>
          <div className="mt-1 text-xs font-medium text-cyan-700">Visible in Patient Booking</div>
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('staff')}
          className={`rounded-2xl border bg-white p-5 text-left ${roleFilter === 'staff' ? 'border-cyan-600 ring-2 ring-cyan-100' : 'border-slate-200'}`}
        >
          <div className="font-mono text-[11px] font-bold uppercase text-slate-400">Operational Staff</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{counts.operationalStaff}</div>
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('all')}
          className={`rounded-2xl border bg-white p-5 text-left ${roleFilter === 'all' ? 'border-cyan-600 ring-2 ring-cyan-100' : 'border-slate-200'}`}
        >
          <div className="font-mono text-[11px] font-bold uppercase text-slate-400">Total Accounts</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{counts.all}</div>
        </button>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'doctor', 'staff', 'admin'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setRoleFilter(id)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                  roleFilter === id ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-500'
                }`}
              >
                {id === 'all' ? 'All' : roleLabel(id)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, department, ID"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs sm:w-64"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <HeartHandshake className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No staff on this node</p>
            <p className="text-xs text-slate-400">
              Add a doctor to publish them on the Patient Booking app with a consultation fee.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add Staff / Doctor
              </button>
            )}
          </div>
        ) : (
          <StaffDirectoryTable
            staffList={visible}
            setStaffList={setMembers}
            hospitalId={nodeId}
            canManage={canManage}
            onEdit={openEdit}
          />
        )}
      </section>

      {editor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void handleSave(event)}
            className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editor === 'create' ? 'Add Staff / Doctor' : `Edit ${draft.full_name}`}
              </h3>
              <button type="button" disabled={isSaving} onClick={() => setEditor(null)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <input
                required
                disabled={isSaving}
                value={draft.full_name}
                onChange={(e) => setDraft((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Full name"
                className="col-span-2 rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                disabled={isSaving}
                value={draft.staff_id_code}
                onChange={(e) => setDraft((prev) => ({ ...prev, staff_id_code: e.target.value }))}
                placeholder="Staff ID (optional)"
                className="rounded-xl border border-slate-200 px-3 py-2.5 font-mono"
              />
              <select
                disabled={isSaving}
                value={draft.role}
                onChange={(e) => {
                  const role = e.target.value as StaffRole;
                  setDraft((prev) => ({
                    ...prev,
                    role,
                    consultation_fee: role === 'doctor' ? prev.consultation_fee ?? 500 : null,
                  }));
                }}
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <option value="doctor">Doctor</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="email"
                disabled={isSaving}
                value={draft.email}
                onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <div className="relative">
                <input
                  type="text"
                  name="passcode_key"
                  disabled={isSaving}
                  value={draft.passcode_key || ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, passcode_key: e.target.value }))}
                  placeholder="Auto-generated passcode"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-3 font-mono text-sm font-bold text-slate-800 focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="button"
                  title="Generate New Passcode"
                  disabled={isSaving}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      passcode_key: generateSecurePasscode(passcodePrefixForStaffRole(prev.role)),
                    }))
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-600 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <input
                disabled={isSaving}
                value={draft.department}
                onChange={(e) => setDraft((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="Department"
                className="col-span-2 rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                disabled={isSaving}
                value={draft.qualification}
                onChange={(e) => setDraft((prev) => ({ ...prev, qualification: e.target.value }))}
                placeholder="Qualification"
                className="col-span-2 rounded-xl border border-slate-200 px-3 py-2.5"
              />
              {draft.role === 'doctor' && (
                <label className="col-span-2 block font-bold uppercase text-slate-500">
                  Consultation fee (INR)
                  <input
                    required
                    type="number"
                    min={0}
                    step={50}
                    disabled={isSaving}
                    value={draft.consultation_fee ?? 500}
                    onChange={(e) => setDraft((prev) => ({ ...prev, consultation_fee: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
                  />
                </label>
              )}
              <label className="col-span-2 flex items-center gap-2 text-[11px] font-bold uppercase text-slate-600">
                <input
                  type="checkbox"
                  disabled={isSaving}
                  checked={draft.is_active}
                  onChange={(e) => setDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                Active (doctors appear in Patient Booking)
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setEditor(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-cyan-700 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : editor === 'create' ? 'Add to Directory' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
