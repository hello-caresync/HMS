'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Activity,
  AlertOctagon,
  BellRing,
  CheckCircle2,
  Radio,
  RefreshCw,
  X,
} from 'lucide-react';

import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_ID } from '@/lib/regal/constants';

export interface TraumaCase {
  id: string;
  hospital_id: string;
  facility_code: string;
  hospital_code: string;
  patient_name: string;
  patient_uhid?: string;
  priority_tier: 'P1 Critical' | 'P2 Urgent' | 'P3 Non-Urgent' | string;
  chief_complaint: string;
  assigned_doctor_name: string;
  assigned_doctor_id?: string;
  bp: string;
  spo2: number;
  pulse: number;
  temp: number;
  gcs?: number;
  status: 'active' | 'stabilized' | 'transferred' | 'discharged' | string;
  doctor_bypass_triggered: boolean;
  arrival_time?: string;
  created_at: string;
}

type ToastKind = 'success' | 'broadcast' | 'error';

interface EmergencyTriageDeskProps {
  supabase: SupabaseClient;
  facilityCode?: string;
  hospitalId?: string;
  currentDoctorName?: string;
  currentDoctorId?: string;
  /** Opens intake modal from global header quick-entry */
  isOpenModalExternally?: boolean;
  onCloseExternalModal?: () => void;
  /** @deprecated use isOpenModalExternally */
  autoOpenIntake?: boolean;
  /** @deprecated use onCloseExternalModal */
  onIntentHandled?: () => void;
  /** When true, only renders the intake modal overlay (no trauma board) */
  modalOnly?: boolean;
}

function normalizeTraumaRow(row: Record<string, unknown>): TraumaCase {
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? REGAL_HOSPITAL_ID),
    facility_code: String(row.facility_code ?? REGAL_FACILITY_CODE),
    hospital_code: String(row.hospital_code ?? REGAL_FACILITY_CODE),
    patient_name: String(row.patient_name ?? 'Patient'),
    patient_uhid: row.patient_uhid != null ? String(row.patient_uhid) : undefined,
    priority_tier: String(row.priority_tier ?? 'P3 Non-Urgent'),
    chief_complaint: String(row.chief_complaint ?? 'Emergency intake'),
    assigned_doctor_name: String(row.assigned_doctor_name ?? 'On-call trauma team'),
    assigned_doctor_id: row.assigned_doctor_id != null ? String(row.assigned_doctor_id) : undefined,
    bp: String(row.bp ?? '120/80'),
    spo2: Number(row.spo2 ?? 98),
    pulse: Number(row.pulse ?? 80),
    temp: Number(row.temp ?? 37),
    gcs: row.gcs != null ? Number(row.gcs) : undefined,
    status: String(row.status ?? 'active'),
    doctor_bypass_triggered: Boolean(row.doctor_bypass_triggered),
    arrival_time: row.arrival_time != null ? String(row.arrival_time) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: { type: ToastKind; text: string };
  onDismiss: () => void;
}) {
  const styles =
    toast.type === 'broadcast'
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : toast.type === 'success'
        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
        : 'border-rose-300 bg-rose-50 text-rose-900';

  const Icon =
    toast.type === 'broadcast' ? BellRing : toast.type === 'success' ? CheckCircle2 : AlertOctagon;

  const iconClass =
    toast.type === 'broadcast'
      ? 'text-amber-600 animate-bounce'
      : toast.type === 'success'
        ? 'text-emerald-600'
        : 'text-rose-600';

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-md ${styles}`}
      role="status"
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
        <span>{toast.text}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="ml-4 rounded-lg p-1 text-slate-500 transition-colors hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function EmergencyTriageDesk({
  supabase,
  facilityCode = REGAL_FACILITY_CODE,
  hospitalId = REGAL_HOSPITAL_ID,
  currentDoctorName = 'Dr. Chandrakanth S. Kesari',
  currentDoctorId = 'RH-D02',
  isOpenModalExternally = false,
  onCloseExternalModal,
  autoOpenIntake = false,
  onIntentHandled,
  modalOnly = false,
}: EmergencyTriageDeskProps) {
  const externalOpen = isOpenModalExternally || autoOpenIntake;
  const closeExternal = onCloseExternalModal ?? onIntentHandled;

  const [traumaCases, setTraumaCases] = useState<TraumaCase[]>([]);
  const [loading, setLoading] = useState(!modalOnly);
  const [submitting, setSubmitting] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [toast, setToast] = useState<{ type: ToastKind; text: string } | null>(null);

  const [form, setForm] = useState({
    patient_name: '',
    patient_uhid: '',
    priority_tier: 'P1 Critical',
    chief_complaint: '',
    assigned_doctor_name: currentDoctorName,
    bp: '90/60',
    spo2: 91,
    pulse: 128,
    temp: 36.8,
    gcs: 9,
    doctor_bypass: true,
  });

  const fetchTraumaCases = useCallback(async () => {
    if (modalOnly) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergency_triage')
        .select('*')
        .eq('status', 'active')
        .or(`facility_code.eq.${facilityCode},hospital_code.eq.${facilityCode},hospital_id.eq.${hospitalId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTraumaCases((data ?? []).map((row) => normalizeTraumaRow(row as Record<string, unknown>)));
    } catch (err: unknown) {
      console.error('Error fetching triage records:', err);
      setToast({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load trauma cases.',
      });
      setTraumaCases([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, facilityCode, hospitalId, modalOnly]);

  useEffect(() => {
    void fetchTraumaCases();
  }, [fetchTraumaCases]);

  useEffect(() => {
    if (modalOnly) return;

    const channel = supabase
      .channel(`emergency_desk_live_stream_${facilityCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_triage' },
        () => void fetchTraumaCases(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, facilityCode, fetchTraumaCases, modalOnly]);

  useEffect(() => {
    if (externalOpen) {
      setShowIntakeModal(true);
      setForm((current) => ({
        ...current,
        priority_tier: 'P1 Critical',
        doctor_bypass: true,
      }));
    }
  }, [externalOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const closeModal = () => {
    setShowIntakeModal(false);
    closeExternal?.();
  };

  const handleIntakeEmergency = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.patient_name.trim() || !form.chief_complaint.trim()) return;

    setSubmitting(true);
    setToast(null);

    try {
      const now = new Date();
      const arrivalTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const generatedUhid = form.patient_uhid.trim() || `EMR-${now.getTime().toString().slice(-4)}`;

      const { error: insertError } = await supabase.from('emergency_triage').insert({
        hospital_id: hospitalId,
        facility_code: facilityCode,
        hospital_code: facilityCode,
        patient_name: form.patient_name.trim(),
        patient_uhid: generatedUhid,
        priority_tier: form.priority_tier,
        chief_complaint: form.chief_complaint.trim(),
        assigned_doctor_name: form.assigned_doctor_name.trim() || currentDoctorName,
        assigned_doctor_id: currentDoctorId,
        bp: form.bp.trim() || '120/80',
        spo2: Number(form.spo2),
        pulse: Number(form.pulse),
        temp: Number(form.temp),
        gcs: Number(form.gcs),
        status: 'active',
        doctor_bypass_triggered: form.doctor_bypass,
        arrival_time: arrivalTimeString,
        updated_at: now.toISOString(),
      });

      if (insertError) throw insertError;

      if (form.doctor_bypass) {
        const bypassMessage = `DOCTOR BYPASS: [${form.priority_tier}] ${form.patient_name.trim()} admitted with "${form.chief_complaint.trim()}". Vitals: BP ${form.bp}, SpO2 ${form.spo2}%, Pulse ${form.pulse} bpm. Immediate bedside presence required!`;

        await supabase.from('channel_messages').insert({
          hospital_id: hospitalId,
          facility_code: facilityCode,
          hospital_code: facilityCode,
          channel_type: 'emergency',
          sender_role: 'emergency_triage',
          sender_id: 'TRIAGE-DESK',
          sender_name: 'Emergency Triage Desk',
          recipient_type: 'doctor',
          recipient_id: 'ALL',
          message: bypassMessage,
          message_text: bypassMessage,
          priority: 'critical',
          is_read: false,
          created_at: now.toISOString(),
        });

        setToast({
          type: 'broadcast',
          text: `Doctor bypass broadcasted \u2022 On-duty doctors alerted for ${form.patient_name.trim()}`,
        });
      } else {
        setToast({
          type: 'success',
          text: `Admitted ${form.patient_name.trim()} to Emergency Triage Desk.`,
        });
      }

      closeModal();
      setForm({
        patient_name: '',
        patient_uhid: '',
        priority_tier: 'P1 Critical',
        chief_complaint: '',
        assigned_doctor_name: currentDoctorName,
        bp: '90/60',
        spo2: 91,
        pulse: 128,
        temp: 36.8,
        gcs: 9,
        doctor_bypass: true,
      });
      await fetchTraumaCases();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to submit emergency intake.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveCase = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('emergency_triage')
        .update({ status: 'stabilized', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setToast({ type: 'success', text: `${name} marked as stabilized/transferred.` });
      await fetchTraumaCases();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update case.',
      });
    }
  };

  const intakeModal = showIntakeModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-800">Intake Trauma & Trigger Bypass</h3>
          </div>
          <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleIntakeEmergency} className="space-y-3.5 text-xs">
          <Field label="Patient Name / Identifier">
            <input
              type="text"
              required
              placeholder="Patient name or trauma identifier"
              value={form.patient_name}
              onChange={(event) => setForm({ ...form, patient_name: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium focus:bg-white"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority Tier">
              <select
                value={form.priority_tier}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority_tier: event.target.value,
                    doctor_bypass: event.target.value === 'P1 Critical' ? true : form.doctor_bypass,
                  })
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
              >
                <option value="P1 Critical">P1 Critical (Immediate)</option>
                <option value="P2 Urgent">P2 Urgent (15 min)</option>
                <option value="P3 Non-Urgent">P3 Non-Urgent</option>
              </select>
            </Field>
            <Field label="Assign Doctor">
              <input
                type="text"
                value={form.assigned_doctor_name}
                onChange={(event) => setForm({ ...form, assigned_doctor_name: event.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium"
              />
            </Field>
          </div>

          <Field label="Chief Complaint & Symptoms">
            <textarea
              required
              rows={2}
              placeholder="e.g. Acute chest pain, dyspnea, suspected MI"
              value={form.chief_complaint}
              onChange={(event) => setForm({ ...form, chief_complaint: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs focus:bg-white"
            />
          </Field>

          <Field label="Intake Vitals">
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  ['bp', 'BP', 'text', '90/60'],
                  ['spo2', 'SpO2 %', 'number', '91'],
                  ['pulse', 'Pulse', 'number', '128'],
                  ['temp', 'Temp °C', 'number', '36.8'],
                  ['gcs', 'GCS', 'number', '9'],
                ] as const
              ).map(([key, label, inputType, placeholder]) => (
                <div key={key}>
                  <span className="mb-0.5 block text-[10px] font-semibold text-slate-400">{label}</span>
                  <input
                    type={inputType}
                    step={key === 'temp' ? '0.1' : '1'}
                    min={key === 'gcs' ? 3 : undefined}
                    max={key === 'gcs' ? 15 : undefined}
                    placeholder={placeholder}
                    value={String(form[key])}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        [key]:
                          key === 'bp' ? event.target.value : Number(event.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs font-bold"
                  />
                </div>
              ))}
            </div>
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <input
              type="checkbox"
              checked={form.doctor_bypass}
              onChange={(event) => setForm({ ...form, doctor_bypass: event.target.checked })}
              className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <div>
              <span className="block font-bold text-rose-900">Broadcast Instant Doctor Bypass Alert</span>
              <span className="text-[11px] text-rose-700">
                Notifies doctor OPD workspace and sends high-priority channel alert
              </span>
            </div>
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              <BellRing className="h-3.5 w-3.5" />
              {submitting ? 'Admitting…' : form.doctor_bypass ? 'Admit & Broadcast' : 'Admit Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (modalOnly) {
    return (
      <>
        {toast && !showIntakeModal && (
          <div className="fixed left-1/2 top-4 z-[110] w-full max-w-xl -translate-x-1/2 px-4">
            <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
          </div>
        )}
        {intakeModal}
      </>
    );
  }

  return (
    <div className="relative space-y-5">
      {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50/60 px-6 py-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse text-rose-600" />
              <h2 className="text-sm font-bold tracking-tight text-slate-800">Active Trauma Cases</h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {traumaCases.length} active {'\u2022'} priority scored on arrival {'\u2022'} live real-time sync
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIntakeModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95"
            >
              <AlertOctagon className="h-4 w-4" />
              Trigger Doctor Bypass
            </button>
            <button
              type="button"
              onClick={() => void fetchTraumaCases()}
              title="Refresh Triage"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {traumaCases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500 opacity-80" />
              <h4 className="text-xs font-bold text-slate-700">Emergency Desk Clear</h4>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                No active trauma cases. Click &quot;Trigger Doctor Bypass&quot; to register an incoming emergency.
              </p>
            </div>
          ) : (
            traumaCases.map((traumaCase) => {
              const tier = String(traumaCase.priority_tier);
              const isP1 = tier.includes('P1') || tier.toLowerCase().includes('critical');
              const isP2 = tier.includes('P2') || tier.toLowerCase().includes('urgent');

              return (
                <div
                  key={traumaCase.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isP1
                      ? 'border-rose-200/90 bg-rose-50/40 shadow-sm'
                      : isP2
                        ? 'border-amber-200/80 bg-amber-50/30'
                        : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm font-bold text-slate-900">{traumaCase.patient_name}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ${
                            isP1 ? 'bg-rose-600' : isP2 ? 'bg-amber-500' : 'bg-slate-600'
                          }`}
                        >
                          {traumaCase.priority_tier}
                        </span>
                        {traumaCase.doctor_bypass_triggered && (
                          <span className="inline-flex items-center gap-1 rounded border border-rose-300 bg-rose-100/70 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            <Radio className="h-2.5 w-2.5 animate-ping text-rose-600" />
                            Bypass Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-600">{traumaCase.chief_complaint}</p>
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-bold text-slate-700">
                        Arrived{' '}
                        {traumaCase.arrival_time ||
                          new Date(traumaCase.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">{traumaCase.assigned_doctor_name}</div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <VitalChip label="BP" value={traumaCase.bp || '120/80'} />
                      <VitalChip
                        label="SpO2"
                        value={`${traumaCase.spo2 ?? 98}%`}
                        alert={Boolean(traumaCase.spo2 && traumaCase.spo2 < 92)}
                      />
                      <VitalChip
                        label="Pulse"
                        value={String(traumaCase.pulse ?? 80)}
                        alert={Boolean(traumaCase.pulse && traumaCase.pulse > 110)}
                      />
                      <VitalChip label="Temp" value={`${traumaCase.temp ?? 37}°C`} />
                      {traumaCase.gcs != null && (
                        <VitalChip label="GCS" value={String(traumaCase.gcs)} alert={traumaCase.gcs <= 9} />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleResolveCase(traumaCase.id, traumaCase.patient_name)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Mark Stabilized
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {intakeModal}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-bold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function VitalChip({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
      <span className="mr-1 font-normal text-slate-400">{label}</span>
      <strong className={alert ? 'font-black text-rose-600' : 'text-slate-900'}>{value}</strong>
    </div>
  );
}
