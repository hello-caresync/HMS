'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  HeartPulse,
  Loader2,
  Siren,
  Stethoscope,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import {
  attendEmergencyCase,
  completeEmergencyCase,
  loadAssignedEmergencyCases,
  type EmergencyClinicalCase,
} from '@/lib/hospital/operations/emergency-clinical-sync';

type EmergencyBypassTakeoverProps = {
  /** Regal doctor ID e.g. RH-D02 */
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  supabase?: SupabaseClient;
};

const EMPTY_VITALS = {
  bp: '',
  spo2: '',
  pulse: '',
  temp: '',
  gcs: '',
  prescription_notes: '',
};

export default function EmergencyBypassTakeover({
  assignedDoctorId = 'RH-D02',
  assignedDoctorName = 'Dr. Chandrakanth S. Kesari',
  supabase: supabaseProp,
}: EmergencyBypassTakeoverProps) {
  const supabase = supabaseProp ?? createClient();
  const [cases, setCases] = useState<EmergencyClinicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendingCase, setAttendingCase] = useState<EmergencyClinicalCase | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [vitalsForm, setVitalsForm] = useState(EMPTY_VITALS);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await loadAssignedEmergencyCases(supabase, assignedDoctorId);
      setCases(rows.filter((row) => row.doctor_bypass_triggered));
    } finally {
      setLoading(false);
    }
  }, [supabase, assignedDoctorId]);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    const channel = supabase
      .channel(`doctor_emergency_bypass_${assignedDoctorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_triage' },
        () => void fetchCases(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, assignedDoctorId, fetchCases]);

  const pendingCases = useMemo(
    () => cases.filter((row) => row.status === 'active' || row.status === 'in_treatment'),
    [cases],
  );

  const bannerCase = pendingCases[0] ?? null;

  const openAttend = async (clinicalCase: EmergencyClinicalCase) => {
    if (clinicalCase.status === 'active') {
      const result = await attendEmergencyCase(supabase, clinicalCase.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not open emergency case');
        return;
      }
    }
    setAttendingCase({ ...clinicalCase, status: 'in_treatment' });
    setVitalsForm({
      bp: clinicalCase.bp && clinicalCase.bp !== 'Pending' ? clinicalCase.bp : '',
      spo2: clinicalCase.spo2 != null ? String(clinicalCase.spo2) : '',
      pulse: clinicalCase.pulse != null ? String(clinicalCase.pulse) : '',
      temp: clinicalCase.temp != null ? String(clinicalCase.temp) : '',
      gcs: clinicalCase.gcs != null ? String(clinicalCase.gcs) : '',
      prescription_notes: clinicalCase.doctor_prescription_notes ?? '',
    });
    void fetchCases();
  };

  const closeAttend = () => {
    setAttendingCase(null);
    setVitalsForm(EMPTY_VITALS);
  };

  const handleComplete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!attendingCase) return;

    setSubmitting(true);
    const result = await completeEmergencyCase(supabase, attendingCase.id, {
      bp: vitalsForm.bp.trim() || 'Pending',
      spo2: vitalsForm.spo2.trim() ? Number(vitalsForm.spo2) : null,
      pulse: vitalsForm.pulse.trim() ? Number(vitalsForm.pulse) : null,
      temp: vitalsForm.temp.trim() ? Number(vitalsForm.temp) : null,
      gcs: vitalsForm.gcs.trim() ? Number(vitalsForm.gcs) : null,
      doctor_prescription_notes: vitalsForm.prescription_notes,
      disposition: 'completed',
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? 'Failed to complete emergency case');
      return;
    }

    toast.success(`${attendingCase.patient_name} stabilized — returning to OPD queue`);
    closeAttend();
    await fetchCases();
  };

  if (loading && pendingCases.length === 0) {
    return null;
  }

  return (
    <>
      {bannerCase && !attendingCase && (
        <div className="animate-pulse rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-50 to-amber-50 px-5 py-4 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-600 p-2 text-white">
                <Siren className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-rose-700">
                  High-Priority Emergency Bypass
                </p>
                <p className="text-base font-black text-slate-900">
                  {bannerCase.patient_name} — {bannerCase.priority_tier}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-600">{bannerCase.chief_complaint}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Assigned to {assignedDoctorName} · UHID {bannerCase.patient_uhid || '—'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void openAttend(bannerCase)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-xs font-black text-white shadow-md transition hover:bg-rose-700 active:scale-95"
            >
              <Stethoscope className="h-4 w-4" />
              Attend Emergency Case
            </button>
          </div>
          {pendingCases.length > 1 && (
            <p className="mt-2 text-[11px] font-bold text-rose-700">
              +{pendingCases.length - 1} additional bypass case(s) in queue
            </p>
          )}
        </div>
      )}

      {attendingCase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-rose-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rose-100 bg-rose-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <div>
                  <h2 className="text-sm font-black text-slate-900">Emergency Bedside Assessment</h2>
                  <p className="text-[11px] font-semibold text-slate-500">{attendingCase.patient_name}</p>
                </div>
              </div>
              <button type="button" onClick={closeAttend} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleComplete} className="space-y-5 p-6 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chief Complaint</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{attendingCase.chief_complaint}</p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Priority: <strong>{attendingCase.priority_tier}</strong> · Arrived{' '}
                  {attendingCase.arrival_time ?? '—'}
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 font-bold text-slate-700">
                  <HeartPulse className="h-3.5 w-3.5 text-rose-600" />
                  Bedside Vitals (record now)
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(
                    [
                      ['bp', 'BP', 'text', '120/80'],
                      ['spo2', 'SpO2 %', 'number', '98'],
                      ['pulse', 'Pulse', 'number', '75'],
                      ['temp', 'Temp °C', 'number', '37.0'],
                      ['gcs', 'GCS', 'number', '15'],
                    ] as const
                  ).map(([key, label, type, placeholder]) => (
                    <div key={key}>
                      <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">{label}</label>
                      <input
                        type={type}
                        step={key === 'temp' ? '0.1' : '1'}
                        placeholder={placeholder}
                        value={vitalsForm[key]}
                        onChange={(event) =>
                          setVitalsForm({ ...vitalsForm, [key]: event.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-2 py-2 text-center text-xs font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Emergency Prescription / Intervention Notes
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="IV access, medications, fluids, orders, disposition plan…"
                  value={vitalsForm.prescription_notes}
                  onChange={(event) =>
                    setVitalsForm({ ...vitalsForm, prescription_notes: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs focus:bg-white"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAttend}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Return to OPD Queue
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Complete & Discharge to Ward / Stabilize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!bannerCase && !attendingCase && cases.length === 0 && null}
    </>
  );
}

export { EmergencyBypassTakeover };
