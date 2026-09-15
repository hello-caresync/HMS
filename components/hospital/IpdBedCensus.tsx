'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BedDouble,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import {
  admitPatientToBed,
  BED_STATUS_OPTIONS,
  BED_TYPE_RATES,
  bedStatusClass,
  defaultRateForBedType,
  deleteHospitalBed,
  dischargePatientFromBed,
  fetchHospitalBeds,
  formatAdmittedAt,
  formatInr,
  inferBedTypeFromWard,
  insertHospitalBed,
  updateHospitalBedDetails,
  updateHospitalBedStatus,
  WARD_OPTIONS,
  type BedStatus,
  type BedType,
  type HospitalBed,
} from '@/lib/hospital/ward-beds';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type IpdDirectoryPatient = {
  uhid: string;
  patient_name: string;
};

type BedFormState = {
  ward_name: string;
  bed_number: string;
  bed_type: BedType;
  daily_rate: number;
};

type AdmitFormState = {
  patient_uhid: string;
  patient_name: string;
};

const EMPTY_BED_FORM: BedFormState = {
  ward_name: WARD_OPTIONS[0],
  bed_number: '',
  bed_type: 'General',
  daily_rate: BED_TYPE_RATES.General,
};

function applyWardToForm(ward: string): Pick<BedFormState, 'ward_name' | 'bed_type' | 'daily_rate'> {
  const bedType = inferBedTypeFromWard(ward);
  return { ward_name: ward, bed_type: bedType, daily_rate: defaultRateForBedType(bedType) };
}

function formFromBed(bed: HospitalBed): BedFormState {
  return {
    ward_name: bed.ward_name || WARD_OPTIONS[0],
    bed_number: bed.bed_number,
    bed_type: bed.bed_type,
    daily_rate: bed.daily_rate || defaultRateForBedType(bed.bed_type),
  };
}

export function IpdBedCensus({
  hospitalId,
  hospitalName,
  patients = [],
  onBedsChanged,
}: {
  hospitalId: string;
  hospitalName: string;
  patients?: IpdDirectoryPatient[];
  onBedsChanged?: (beds: HospitalBed[]) => void;
}) {
  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const onBedsChangedRef = useRef(onBedsChanged);
  onBedsChangedRef.current = onBedsChanged;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyBedId, setBusyBedId] = useState<string | null>(null);
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<HospitalBed | null>(null);
  const [admittingBed, setAdmittingBed] = useState<HospitalBed | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HospitalBed | null>(null);
  const [bedForm, setBedForm] = useState<BedFormState>(EMPTY_BED_FORM);
  const [admitForm, setAdmitForm] = useState<AdmitFormState>({ patient_uhid: '', patient_name: '' });
  const [isSaving, setIsSaving] = useState(false);

  const publishBeds = useCallback((next: HospitalBed[]) => {
    setBeds(next);
    onBedsChangedRef.current?.(next);
  }, []);

  const fetchBeds = useCallback(
    async (silent = false) => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      if (!silent) setIsRefreshing(true);
      try {
        const next = await fetchHospitalBeds(supabase, nodeId);
        publishBeds(next);
      } catch (err: unknown) {
        console.error('Failed to load hospital beds:', err);
        toast.error(err instanceof Error ? err.message : 'Could not load bed census');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [nodeId, publishBeds],
  );

  useEffect(() => {
    void fetchBeds();
  }, [fetchBeds]);

  const counts = useMemo(() => {
    const occupied = beds.filter((bed) => bed.status === 'occupied').length;
    return {
      total: beds.length,
      occupied,
      available: beds.filter((bed) => bed.status === 'available').length,
      maintenance: beds.filter((bed) => bed.status === 'maintenance').length,
      reserved: beds.filter((bed) => bed.status === 'reserved').length,
      occupancy: beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0,
    };
  }, [beds]);

  const handleAddBed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || isSaving) return;
    setIsSaving(true);
    try {
      const result = await insertHospitalBed(supabase, nodeId, bedForm);
      if (result.error) {
        toast.error(`Failed to add bed: ${result.error}`);
        return;
      }
      toast.success(`Bed ${bedForm.bed_number.trim()} registered successfully!`);
      setIsAddModalOpen(false);
      setBedForm(EMPTY_BED_FORM);
      await fetchBeds(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !editingBed || isSaving) return;
    setIsSaving(true);
    try {
      const result = await updateHospitalBedDetails(supabase, nodeId, editingBed.id, bedForm);
      if (result.error) {
        toast.error(`Failed to update bed details: ${result.error}`);
        return;
      }
      toast.success('Bed configuration updated');
      setEditingBed(null);
      await fetchBeds(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (bed: HospitalBed, nextStatus: BedStatus) => {
    if (!supabase || bed.status === nextStatus) return;
    if (nextStatus === 'occupied') {
      setAdmitForm({
        patient_uhid: bed.patient_uhid,
        patient_name: bed.patient_name,
      });
      setAdmittingBed(bed);
      return;
    }
    if (bed.status === 'occupied') {
      if (nextStatus === 'available') {
        await handleDischargePatient(bed);
        return;
      }
      const confirmed = window.confirm(
        `Bed ${bed.bed_number} is occupied by ${bed.patient_name || 'a patient'}. Mark as ${nextStatus} and clear the admission?`,
      );
      if (!confirmed) return;
    }

    setBusyBedId(bed.id);
    try {
      const result = await updateHospitalBedStatus(supabase, nodeId, bed.id, nextStatus);
      if (result.error) {
        toast.error(`Status update failed: ${result.error}`);
        return;
      }
      toast.success(`Bed marked as ${nextStatus}`);
      await fetchBeds(true);
    } finally {
      setBusyBedId(null);
    }
  };

  const handleAdmitPatient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !admittingBed || isSaving) return;
    setIsSaving(true);
    try {
      const result = await admitPatientToBed(supabase, nodeId, admittingBed.id, admitForm);
      if (result.error) {
        toast.error(`Admission failed: ${result.error}`);
        return;
      }
      toast.success(`${admitForm.patient_name.trim()} admitted to bed ${admittingBed.bed_number}`);
      setAdmittingBed(null);
      setAdmitForm({ patient_uhid: '', patient_name: '' });
      await fetchBeds(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDischargePatient = async (bed: HospitalBed) => {
    if (!supabase) return;
    const confirmed = window.confirm('Confirm patient discharge and mark bed available?');
    if (!confirmed) return;

    setBusyBedId(bed.id);
    try {
      const result = await dischargePatientFromBed(supabase, nodeId, bed.id);
      if (result.error) {
        toast.error(`Discharge failed: ${result.error}`);
        return;
      }
      toast.success('Patient discharged. Bed is now available.');
      await fetchBeds(true);
    } finally {
      setBusyBedId(null);
    }
  };

  const handleDeleteBed = async () => {
    if (!supabase || !pendingDelete || isSaving) return;
    setIsSaving(true);
    try {
      const result = await deleteHospitalBed(supabase, nodeId, pendingDelete.id);
      if (result.error) {
        toast.error(`Failed to delete bed: ${result.error}`);
        return;
      }
      toast.success(`Bed ${pendingDelete.bed_number} removed`);
      setPendingDelete(null);
      await fetchBeds(true);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setBedForm({ ...EMPTY_BED_FORM, ...applyWardToForm(WARD_OPTIONS[0]) });
    setIsAddModalOpen(true);
  };

  const selectDirectoryPatient = (uhid: string) => {
    const match = patients.find((patient) => patient.uhid === uhid);
    setAdmitForm((prev) => ({
      patient_uhid: uhid,
      patient_name: match?.patient_name ?? prev.patient_name,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-700" />
        Loading IPD bed census…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            IPD Command · Node {nodeId} ({hospitalName})
          </div>
          <h3 className="mt-1 text-lg font-black text-slate-900">IPD &amp; Bed Census</h3>
          <p className="text-xs text-slate-500">
            Register, edit, admit, discharge, and retire beds directly on this hospital node.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchBeds()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Register Bed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-mono text-[10px] font-bold uppercase text-slate-400">Occupancy</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{counts.occupancy}%</div>
          <div className="text-[11px] text-cyan-700">{counts.occupied}/{counts.total} occupied</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-mono text-[10px] font-bold uppercase text-slate-400">Available</div>
          <div className="mt-1 text-2xl font-black text-emerald-700">{counts.available}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-mono text-[10px] font-bold uppercase text-slate-400">Reserved</div>
          <div className="mt-1 text-2xl font-black text-violet-700">{counts.reserved}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-mono text-[10px] font-bold uppercase text-slate-400">Maintenance</div>
          <div className="mt-1 text-2xl font-black text-amber-700">{counts.maintenance}</div>
        </div>
      </div>

      {beds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <BedDouble className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">No Beds Registered</p>
          <p className="text-xs text-slate-400">Register the first ward allocation for this hospital node.</p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Register Bed
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {beds.map((bed) => {
            const occupied = bed.status === 'occupied';
            const canAdmit = bed.status === 'available' || bed.status === 'reserved';
            const busy = busyBedId === bed.id;
            return (
              <div key={bed.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      {bed.ward_name || 'Unassigned ward'} · Bed {bed.bed_number}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {bed.bed_type} · {formatInr(bed.daily_rate)} / day
                    </div>
                  </div>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${bedStatusClass(bed.status)}`}>
                    {bed.status}
                  </span>
                </div>

                {occupied ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2 text-[11px] text-rose-900">
                    <div className="font-bold">{bed.patient_name || 'Admitted patient'}</div>
                    <div className="font-mono">UHID {bed.patient_uhid || 'N/A'}</div>
                    <div className="mt-0.5 text-rose-700">{formatAdmittedAt(bed.admitted_at)}</div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                    {bed.status === 'maintenance'
                      ? 'Blocked for maintenance'
                      : bed.status === 'reserved'
                        ? 'Held for incoming admission'
                        : 'Available for admission'}
                  </div>
                )}

                <label className="block text-[10px] font-bold uppercase text-slate-500">
                  Status
                  <select
                    disabled={busy || isSaving}
                    value={bed.status}
                    onChange={(event) => void handleStatusChange(bed, event.target.value as BedStatus)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium normal-case text-slate-800"
                  >
                    {BED_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-wrap gap-2">
                  {canAdmit ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setAdmitForm({ patient_uhid: '', patient_name: '' });
                        setAdmittingBed(bed);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-cyan-700 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Admit
                    </button>
                  ) : null}
                  {occupied ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDischargePatient(bed)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      Discharge
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setBedForm(formFromBed(bed));
                      setEditingBed(bed);
                    }}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPendingDelete(bed)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddModalOpen ? (
        <BedEditorModal
          title="Register Bed"
          submitLabel={isSaving ? 'Saving…' : 'Register Bed'}
          form={bedForm}
          disabled={isSaving}
          onChange={setBedForm}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddBed}
        />
      ) : null}

      {editingBed ? (
        <BedEditorModal
          title={`Edit Bed ${editingBed.bed_number}`}
          submitLabel={isSaving ? 'Saving…' : 'Save Configuration'}
          form={bedForm}
          disabled={isSaving}
          onChange={setBedForm}
          onClose={() => setEditingBed(null)}
          onSubmit={handleUpdateBed}
        />
      ) : null}

      {admittingBed ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void handleAdmitPatient(event)}
            className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Admit to {admittingBed.ward_name} · Bed {admittingBed.bed_number}
              </h3>
              <button type="button" disabled={isSaving} onClick={() => setAdmittingBed(null)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Patient UHID
              <input
                required
                list="ipd-patient-directory"
                disabled={isSaving}
                value={admitForm.patient_uhid}
                onChange={(event) => selectDirectoryPatient(event.target.value)}
                placeholder="RH-2026-0041"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs font-medium normal-case"
              />
            </label>
            <datalist id="ipd-patient-directory">
              {patients
                .filter((patient) => patient.uhid.trim())
                .map((patient) => (
                  <option key={patient.uhid} value={patient.uhid}>
                    {patient.patient_name}
                  </option>
                ))}
            </datalist>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Patient name
              <input
                required
                disabled={isSaving}
                value={admitForm.patient_name}
                onChange={(event) => setAdmitForm((prev) => ({ ...prev, patient_name: event.target.value }))}
                placeholder="Full name"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium normal-case"
              />
            </label>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setAdmittingBed(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-cyan-700 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? 'Admitting…' : 'Admit Patient'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">
              Decommission bed {pendingDelete.bed_number}?
            </h3>
            <p className="text-xs text-slate-500">
              This permanently removes {pendingDelete.ward_name} · {pendingDelete.bed_number} from{' '}
              <span className="font-mono">hospital_beds</span>.
              {pendingDelete.status === 'occupied'
                ? ' Discharge the patient first if this occupancy should be closed cleanly.'
                : ''}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setPendingDelete(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleDeleteBed()}
                className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? 'Removing…' : 'Delete Bed'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BedEditorModal({
  title,
  submitLabel,
  form,
  disabled,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  form: BedFormState;
  disabled: boolean;
  onChange: React.Dispatch<React.SetStateAction<BedFormState>>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-xs shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button type="button" disabled={disabled} onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <label className="block font-bold uppercase text-slate-600">
          Ward
          <select
            required
            disabled={disabled}
            value={form.ward_name}
            onChange={(event) => onChange((prev) => ({ ...prev, ...applyWardToForm(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
          >
            {WARD_OPTIONS.map((ward) => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-bold uppercase text-slate-600">
          Bed number
          <input
            required
            disabled={disabled}
            value={form.bed_number}
            onChange={(event) => onChange((prev) => ({ ...prev, bed_number: event.target.value }))}
            placeholder="GW-105, ICU-03"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
          />
        </label>
        <label className="block font-bold uppercase text-slate-600">
          Bed category
          <select
            disabled={disabled}
            value={form.bed_type}
            onChange={(event) => {
              const bedType = event.target.value as BedType;
              onChange((prev) => ({ ...prev, bed_type: bedType, daily_rate: defaultRateForBedType(bedType) }));
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
          >
            {Object.entries(BED_TYPE_RATES).map(([type, rate]) => (
              <option key={type} value={type}>
                {type} · {formatInr(rate)}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-bold uppercase text-slate-600">
          Daily tariff (INR)
          <input
            required
            type="number"
            min={0}
            step={50}
            disabled={disabled}
            value={form.daily_rate}
            onChange={(event) => onChange((prev) => ({ ...prev, daily_rate: Number(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
          />
        </label>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={disabled}
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="rounded-lg bg-cyan-700 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
