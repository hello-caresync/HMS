'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Activity,
  AlertOctagon,
  BellRing,
  CheckCircle2,
  HeartPulse,
  Radio,
  RefreshCw,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';

import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_ID } from '@/lib/regal/constants';
import {
  priorityTierFromCode,
  registerEmergencyTriageIntake,
  type EmergencyPriorityTier,
} from '@/lib/hospital/operations/emergency-triage-sync';

export interface TraumaCase {
  id: string;
  hospital_id: string;
  facility_code: string;
  hospital_code: string;
  patient_name: string;
  patient_uhid?: string;
  priority_tier: EmergencyPriorityTier | string;
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

interface EmergencyTriageDeskProps {
  supabase: SupabaseClient;
  facilityCode?: string;
  hospitalId?: string;
  currentDoctorName?: string;
  currentDoctorId?: string;
  autoOpenIntake?: boolean;
  onIntentHandled?: () => void;
}

const PRIORITY_OPTIONS: EmergencyPriorityTier[] = ['P1 Critical', 'P2 Urgent', 'P3 Non-Urgent'];

function normalizeTraumaRow(row: Record<string, unknown>): TraumaCase {
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? REGAL_HOSPITAL_ID),
    facility_code: String(row.facility_code ?? REGAL_FACILITY_CODE),
    hospital_code: String(row.hospital_code ?? REGAL_FACILITY_CODE),
    patient_name: String(row.patient_name ?? 'Patient'),
    patient_uhid: row.patient_uhid != null ? String(row.patient_uhid) : undefined,
    priority_tier: String(row.priority_tier ?? row.priority ?? 'P3 Non-Urgent'),
    chief_complaint: String(row.chief_complaint ?? row.complaint ?? 'Emergency intake'),
    assigned_doctor_name: String(row.assigned_doctor_name ?? row.surgeon ?? 'On-call trauma team'),
    assigned_doctor_id: row.assigned_doctor_id != null ? String(row.assigned_doctor_id) : undefined,
    bp: String(row.bp ?? '—'),
    spo2: Number(row.spo2 ?? 0),
    pulse: Number(row.pulse ?? 0),
    temp: Number(row.temp ?? 0),
    gcs: row.gcs != null ? Number(row.gcs) : undefined,
    status: String(row.status ?? 'active'),
    doctor_bypass_triggered: Boolean(row.doctor_bypass_triggered),
    arrival_time: row.arrival_time != null ? String(row.arrival_time) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

async function broadcastBypassChannelMessage(
  supabase: SupabaseClient,
  input: {
    hospitalId: string;
    facilityCode: string;
    priorityTier: string;
    patientName: string;
    chiefComplaint: string;
    bp: string;
    spo2: number;
    pulse: number;
  },
): Promise<void> {
  const message = `[${input.priorityTier}] ${input.patientName} admitted with "${input.chiefComplaint}". Vitals: BP ${input.bp}, SpO2 ${input.spo2}%, Pulse ${input.pulse} bpm. Immediate bedside presence required!`;

  await supabase.from('channel_messages').insert({
    hospital_id: input.hospitalId,
    facility_code: input.facilityCode,
    hospital_code: input.facilityCode,
    channel_type: 'emergency',
    sender_role: 'emergency_triage',
    sender_id: 'TRIAGE-DESK',
    sender_name: 'Emergency Triage Desk',
    recipient_type: 'doctor',
    recipient_id: 'ALL',
    message,
    message_text: message,
    priority: 'critical',
    is_read: false,
    created_at: new Date().toISOString(),
  });
}

export default function EmergencyTriageDesk({
  supabase,
  facilityCode = REGAL_FACILITY_CODE,
  hospitalId = REGAL_HOSPITAL_ID,
  currentDoctorName = 'Dr. Chandrakanth S. Kesari',
  currentDoctorId = 'RH-D02',
  autoOpenIntake = false,
  onIntentHandled,
}: EmergencyTriageDeskProps) {
  const [traumaCases, setTraumaCases] = useState<TraumaCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    patient_name: '',
    patient_uhid: '',
    priority_tier: 'P1 Critical' as EmergencyPriorityTier,
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
      console.error('Error fetching trauma triage cases:', err);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load trauma cases.',
      });
      setTraumaCases([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, facilityCode, hospitalId]);

  useEffect(() => {
    void fetchTraumaCases();
  }, [fetchTraumaCases]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime_emergency_triage_stream_${facilityCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_triage' },
        () => void fetchTraumaCases(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, facilityCode, fetchTraumaCases]);

  useEffect(() => {
    if (!autoOpenIntake) return;
    setShowIntakeModal(true);
    setForm((current) => ({
      ...current,
      priority_tier: 'P1 Critical',
      doctor_bypass: true,
    }));
    onIntentHandled?.();
  }, [autoOpenIntake, onIntentHandled]);

  const handleIntakeEmergencyPatient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.patient_name.trim() || !form.chief_complaint.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const bypass = form.doctor_bypass || form.priority_tier === 'P1 Critical';

      const result = await registerEmergencyTriageIntake(supabase, {
        patient_name: form.patient_name.trim(),
        patient_uhid: form.patient_uhid.trim() || undefined,
        chief_complaint: form.chief_complaint.trim(),
        priority_tier: form.priority_tier,
        assigned_doctor_id: currentDoctorId,
        assigned_doctor_name: form.assigned_doctor_name.trim() || currentDoctorName,
        bp: form.bp.trim() || '120/80',
        spo2: Number(form.spo2),
        pulse: Number(form.pulse),
        temp: Number(form.temp),
        gcs: Number(form.gcs),
        trigger_doctor_bypass: bypass,
      });

      if (!result.ok) {
        throw new Error(result.error ?? 'Failed to submit trauma intake.');
      }

      if (bypass) {
        await broadcastBypassChannelMessage(supabase, {
          hospitalId,
          facilityCode,
          priorityTier: form.priority_tier,
          patientName: form.patient_name.trim(),
          chiefComplaint: form.chief_complaint.trim(),
          bp: form.bp.trim() || '120/80',
          spo2: Number(form.spo2),
          pulse: Number(form.pulse),
        });
      }

      setFeedback({
        type: 'success',
        message: `Admitted ${form.patient_name} (${form.priority_tier})${
          bypass ? ' — Doctor Bypass Alert Broadcasted' : ''
        }`,
      });

      setShowIntakeModal(false);
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
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit trauma intake.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveCase = async (id: string, patientName: string) => {
    try {
      const { error } = await supabase
        .from('emergency_triage')
        .update({ status: 'stabilized', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setFeedback({ type: 'success', message: `${patientName} marked as stabilized.` });
      await fetchTraumaCases();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update case.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-semibold transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse text-rose-600" />
              <h2 className="text-sm font-bold tracking-tight text-slate-800">Active Trauma Cases</h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {traumaCases.length} active {'\u2022'} priority scored on arrival {'\u2022'} live Realtime sync
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
                No active trauma or critical bypass cases right now. Click &quot;Trigger Doctor Bypass&quot; to admit
                an incoming emergency.
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
                      ? 'border-rose-200/80 bg-rose-50/40 shadow-sm'
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
                          {priorityTierFromCode(tier)}
                        </span>
                        {traumaCase.doctor_bypass_triggered && (
                          <span className="inline-flex items-center gap-1 rounded border border-rose-300 bg-rose-100/70 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            <Radio className="h-2.5 w-2.5 animate-ping text-rose-600" />
                            Bypass Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-600">{traumaCase.chief_complaint}</p>
                      {traumaCase.patient_uhid && (
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">UHID {traumaCase.patient_uhid}</p>
                      )}
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
                      <VitalChip label="BP" value={traumaCase.bp} />
                      <VitalChip
                        label="SpO2"
                        value={`${traumaCase.spo2}%`}
                        alert={traumaCase.spo2 < 92}
                        icon={<Wind className="h-3 w-3 text-slate-400" />}
                      />
                      <VitalChip
                        label="Pulse"
                        value={String(traumaCase.pulse)}
                        alert={traumaCase.pulse > 110}
                        icon={<HeartPulse className="h-3 w-3 text-slate-400" />}
                      />
                      <VitalChip
                        label="Temp"
                        value={`${traumaCase.temp}°C`}
                        icon={<Thermometer className="h-3 w-3 text-slate-400" />}
                      />
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

      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800">Intake Trauma / Doctor Bypass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleIntakeEmergencyPatient} className="space-y-3.5 text-xs">
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
                        priority_tier: event.target.value as EmergencyPriorityTier,
                        doctor_bypass:
                          event.target.value === 'P1 Critical' ? true : form.doctor_bypass,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium focus:bg-white"
                  >
                    {PRIORITY_OPTIONS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="UHID (optional)">
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={form.patient_uhid}
                    onChange={(event) => setForm({ ...form, patient_uhid: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium focus:bg-white"
                  />
                </Field>
              </div>

              <Field label="Chief Complaint">
                <input
                  type="text"
                  required
                  placeholder="RTA · head trauma · GCS 9"
                  value={form.chief_complaint}
                  onChange={(event) => setForm({ ...form, chief_complaint: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium focus:bg-white"
                />
              </Field>

              <Field label="Assigned Trauma Surgeon">
                <input
                  type="text"
                  value={form.assigned_doctor_name}
                  onChange={(event) => setForm({ ...form, assigned_doctor_name: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium focus:bg-white"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {(
                  [
                    ['bp', 'BP', '90/60'],
                    ['spo2', 'SpO2', '91'],
                    ['pulse', 'Pulse', '128'],
                    ['temp', 'Temp °C', '36.8'],
                    ['gcs', 'GCS', '9'],
                  ] as const
                ).map(([key, label, placeholder]) => (
                  <Field key={key} label={label}>
                    <input
                      type={key === 'bp' ? 'text' : 'number'}
                      step={key === 'temp' ? '0.1' : '1'}
                      placeholder={placeholder}
                      value={String(form[key])}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          [key]:
                            key === 'bp'
                              ? event.target.value
                              : key === 'temp'
                                ? Number(event.target.value)
                                : Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium focus:bg-white"
                    />
                  </Field>
                ))}
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  checked={form.doctor_bypass}
                  onChange={(event) => setForm({ ...form, doctor_bypass: event.target.checked })}
                />
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <BellRing className="h-3.5 w-3.5" />
                  Trigger Doctor Bypass — broadcast critical alert to on-duty doctors
                </span>
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {submitting
                    ? 'Admitting…'
                    : form.doctor_bypass
                      ? 'Admit & Broadcast Bypass Alert'
                      : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  icon,
}: {
  label: string;
  value: string;
  alert?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
      {icon}
      <span className="font-normal text-slate-400">{label}</span>
      <strong className={alert ? 'font-black text-rose-600' : 'text-slate-900'}>{value}</strong>
    </div>
  );
}
