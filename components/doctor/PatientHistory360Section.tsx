'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Droplets, HeartPulse, Loader2, Scale, Wind } from 'lucide-react';

import type { DoctorQueueRow } from '@/lib/doctor/command-center/types';
import {
  calculatePatientBmi,
  fetchPatientClinicalRecordByPhone,
  hasBaselineVitals,
  hasClinicalAlerts,
  mapPatientsRowToClinicalRecord,
  resolveQueuePatientPhone,
  type PatientClinicalRecord,
} from '@/lib/patient/patients-record';
import { supabase } from '@/lib/supabase';

type PatientHistory360SectionProps = {
  activePatient: DoctorQueueRow | null;
};

function emptyClinicalRecord(patient: DoctorQueueRow): PatientClinicalRecord {
  return {
    patient_id: String(patient.patient_id ?? ''),
    full_name: patient.patient_name || patient.name || '',
    phone: resolveQueuePatientPhone(patient),
    email: '',
    age: patient.age != null ? String(patient.age) : '',
    gender: patient.gender || '',
    blood_group: patient.blood_group || '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
    height_cm: '',
    weight_kg: '',
    bmi: '',
    blood_pressure: '',
    heart_rate_bpm: '',
    spo2_percentage: '',
    temperature_f: '',
    hospital_id: 'HOSP-01',
  };
}

function VitalCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

export function PatientHistory360Section({ activePatient }: PatientHistory360SectionProps) {
  const [record, setRecord] = useState<PatientClinicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!activePatient) {
      setRecord(null);
      setLoadError(null);
      return;
    }

    const phone = resolveQueuePatientPhone(activePatient);
    const base = emptyClinicalRecord(activePatient);
    let cancelled = false;

    async function loadPatient360() {
      setIsLoading(true);
      setLoadError(null);

      try {
        if (!phone) {
          if (!cancelled) setRecord(base);
          return;
        }

        const row = await fetchPatientClinicalRecordByPhone(supabase, phone);
        if (cancelled) return;

        if (row) {
          setRecord(mapPatientsRowToClinicalRecord(row, base));
        } else {
          setRecord(base);
        }
      } catch {
        if (!cancelled) {
          setRecord(base);
          setLoadError('Could not load patient baseline profile.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPatient360();
    return () => {
      cancelled = true;
    };
  }, [
    activePatient?.id,
    activePatient?.appointment_id,
    activePatient?.patient_id,
    activePatient?.patient_phone,
    activePatient?.phone,
  ]);

  if (!activePatient) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center">
        <p className="text-[11px] font-bold text-slate-500">
          Select a patient from Section 1 to view baseline profile and vitals.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
        <span className="text-[11px] font-bold text-slate-600">Loading patient 360 profile...</span>
      </div>
    );
  }

  const clinical = record ?? emptyClinicalRecord(activePatient);
  const bloodGroup = clinical.blood_group.trim() || activePatient.blood_group?.trim() || '';
  const showAlerts = hasClinicalAlerts(clinical);
  const hasVitals = hasBaselineVitals(clinical);
  const bmi =
    clinical.bmi.trim() ||
    calculatePatientBmi(clinical.height_cm, clinical.weight_kg) ||
    '—';

  return (
    <div className="mb-3 space-y-3 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Patient Baseline Profile
          </p>
          <p className="text-sm font-black text-slate-900">
            {clinical.full_name || activePatient.patient_name || 'Selected patient'}
          </p>
        </div>
        {bloodGroup ? (
          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-rose-700">
            {bloodGroup}
          </span>
        ) : null}
      </div>

      {loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900">
          {loadError}
        </div>
      ) : null}

      {showAlerts ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wide text-red-800">
                Allergies &amp; Alerts
              </p>
              {clinical.allergies.trim() ? (
                <p className="text-[11px] font-bold text-red-900">
                  <span className="font-black">Allergies:</span> {clinical.allergies.trim()}
                </p>
              ) : null}
              {clinical.chronic_conditions.trim() ? (
                <p className="text-[11px] font-bold text-red-900">
                  <span className="font-black">Chronic:</span> {clinical.chronic_conditions.trim()}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {hasVitals ? (
        <div className="grid grid-cols-2 gap-2">
          <VitalCard
            label="Blood Pressure"
            value={clinical.blood_pressure.trim() || '—'}
            icon={<Droplets className="h-3.5 w-3.5 text-teal-700" />}
          />
          <VitalCard
            label="Heart Rate"
            value={
              clinical.heart_rate_bpm.trim()
                ? `${clinical.heart_rate_bpm.trim()} bpm`
                : '—'
            }
            icon={<HeartPulse className="h-3.5 w-3.5 text-teal-700" />}
          />
          <VitalCard
            label="SpO2"
            value={
              clinical.spo2_percentage.trim()
                ? `${clinical.spo2_percentage.trim()}%`
                : '—'
            }
            icon={<Wind className="h-3.5 w-3.5 text-teal-700" />}
          />
          <VitalCard
            label="BMI"
            value={bmi}
            icon={<Scale className="h-3.5 w-3.5 text-teal-700" />}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
          <p className="text-[11px] font-bold text-slate-500">
            No baseline vitals recorded by patient yet
          </p>
        </div>
      )}

      {(clinical.height_cm.trim() || clinical.weight_kg.trim()) && (
        <p className="text-[10px] font-semibold text-slate-400">
          Height {clinical.height_cm.trim() ? `${clinical.height_cm.trim()} cm` : '—'} • Weight{' '}
          {clinical.weight_kg.trim() ? `${clinical.weight_kg.trim()} kg` : '—'}
        </p>
      )}
    </div>
  );
}
