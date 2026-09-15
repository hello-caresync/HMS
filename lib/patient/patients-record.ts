import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

export type PatientClinicalRecord = {
  patient_id: string;
  full_name: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
  height_cm: string;
  weight_kg: string;
  bmi: string;
  blood_pressure: string;
  heart_rate_bpm: string;
  spo2_percentage: string;
  temperature_f: string;
  hospital_id: string;
};

export function normalizePatientPhone(value?: string | null): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function calculatePatientBmi(heightCm: string, weightKg: string): string {
  const height = parseFloat(heightCm);
  const weight = parseFloat(weightKg);
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0) return '';
  const meters = height / 100;
  const bmi = weight / (meters * meters);
  if (!Number.isFinite(bmi)) return '';
  return bmi.toFixed(1);
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value == null) return '';
  return String(value).trim();
}

function readNumericString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value == null || String(value).trim() === '') return '';
  return String(value).trim();
}

export function mapPatientsRowToClinicalRecord(
  row: Record<string, unknown>,
  base: PatientClinicalRecord,
): PatientClinicalRecord {
  const heightCm =
    readNumericString(row, 'height_cm') ||
    readNumericString(row, 'height') ||
    base.height_cm;
  const weightKg =
    readNumericString(row, 'weight_kg') ||
    readNumericString(row, 'weight') ||
    base.weight_kg;
  const bmi =
    readNumericString(row, 'bmi') || calculatePatientBmi(heightCm, weightKg) || base.bmi;

  return {
    ...base,
    patient_id: readString(row, 'patient_id') || base.patient_id,
    full_name: readString(row, 'full_name') || base.full_name,
    phone: readString(row, 'phone') || base.phone,
    email: readString(row, 'email') || base.email,
    age: readNumericString(row, 'age') || base.age,
    gender: readString(row, 'gender') || base.gender,
    blood_group: readString(row, 'blood_group') || base.blood_group,
    emergency_contact_name:
      readString(row, 'emergency_contact_name') ||
      readString(row, 'emergency_contact') ||
      base.emergency_contact_name,
    emergency_contact_phone:
      readString(row, 'emergency_contact_phone') ||
      readString(row, 'emergency_contact') ||
      base.emergency_contact_phone,
    emergency_contact_relation:
      readString(row, 'emergency_contact_relation') || base.emergency_contact_relation,
    address: readString(row, 'address') || readString(row, 'street_address') || base.address,
    city: readString(row, 'city') || base.city,
    state: readString(row, 'state') || base.state,
    postal_code: readString(row, 'postal_code') || base.postal_code,
    allergies: readString(row, 'allergies') || readString(row, 'known_allergies') || base.allergies,
    chronic_conditions: readString(row, 'chronic_conditions') || base.chronic_conditions,
    current_medications: readString(row, 'current_medications') || base.current_medications,
    height_cm: heightCm,
    weight_kg: weightKg,
    bmi,
    blood_pressure: readString(row, 'blood_pressure') || base.blood_pressure,
    heart_rate_bpm:
      readNumericString(row, 'heart_rate_bpm') ||
      readNumericString(row, 'pulse') ||
      base.heart_rate_bpm,
    spo2_percentage:
      readNumericString(row, 'spo2_percentage') ||
      readNumericString(row, 'spo2') ||
      base.spo2_percentage,
    temperature_f:
      readNumericString(row, 'temperature_f') ||
      readNumericString(row, 'temperature') ||
      base.temperature_f,
    hospital_id: readString(row, 'hospital_id') || base.hospital_id,
  };
}

export function clinicalRecordToPatientsRow(
  record: PatientClinicalRecord,
): Record<string, unknown> {
  const heightCm = record.height_cm.trim();
  const weightKg = record.weight_kg.trim();
  const bmi = record.bmi.trim() || calculatePatientBmi(heightCm, weightKg);

  return {
    patient_id: record.patient_id.trim() || null,
    full_name: record.full_name.trim(),
    phone: record.phone.trim(),
    email: record.email.trim() || null,
    age: record.age.trim() ? parseInt(record.age, 10) : null,
    gender: record.gender.trim() || null,
    blood_group: record.blood_group.trim() || null,
    emergency_contact_name: record.emergency_contact_name.trim() || null,
    emergency_contact_phone: record.emergency_contact_phone.trim() || null,
    emergency_contact_relation: record.emergency_contact_relation.trim() || null,
    address: record.address.trim() || null,
    city: record.city.trim() || null,
    state: record.state.trim() || null,
    postal_code: record.postal_code.trim() || null,
    allergies: record.allergies.trim() || null,
    chronic_conditions: record.chronic_conditions.trim() || null,
    current_medications: record.current_medications.trim() || null,
    height_cm: heightCm ? parseFloat(heightCm) : null,
    weight_kg: weightKg ? parseFloat(weightKg) : null,
    bmi: bmi ? parseFloat(bmi) : null,
    blood_pressure: record.blood_pressure.trim() || null,
    heart_rate_bpm: record.heart_rate_bpm.trim() ? parseInt(record.heart_rate_bpm, 10) : null,
    spo2_percentage: record.spo2_percentage.trim()
      ? parseInt(record.spo2_percentage, 10)
      : null,
    temperature_f: record.temperature_f.trim() ? parseFloat(record.temperature_f) : null,
    hospital_id: record.hospital_id || REGAL_HOSPITAL_CODE,
    updated_at: new Date().toISOString(),
  };
}

export function hasSavedClinicalData(record: PatientClinicalRecord): boolean {
  return Boolean(
    record.blood_group.trim() ||
      record.emergency_contact_name.trim() ||
      record.emergency_contact_phone.trim() ||
      record.address.trim() ||
      record.allergies.trim() ||
      record.chronic_conditions.trim() ||
      record.height_cm.trim() ||
      record.weight_kg.trim() ||
      record.blood_pressure.trim() ||
      record.heart_rate_bpm.trim() ||
      record.spo2_percentage.trim(),
  );
}

export function hasBaselineVitals(record: PatientClinicalRecord): boolean {
  return Boolean(
    record.blood_pressure.trim() ||
      record.heart_rate_bpm.trim() ||
      record.spo2_percentage.trim() ||
      (record.height_cm.trim() && record.weight_kg.trim()),
  );
}

export function hasEmergencyContact(record: PatientClinicalRecord): boolean {
  return Boolean(record.emergency_contact_name.trim() && record.emergency_contact_phone.trim());
}

export function hasClinicalAlerts(record: PatientClinicalRecord): boolean {
  return Boolean(record.allergies.trim() || record.chronic_conditions.trim());
}

export async function fetchPatientClinicalRecordByPhone(
  supabase: SupabaseClient,
  phone: string,
): Promise<Record<string, unknown> | null> {
  const normalized = normalizePatientPhone(phone);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('hospital_id', REGAL_HOSPITAL_CODE)
    .eq('phone', normalized)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as Record<string, unknown>;

  const { data: altData, error: altError } = await supabase
    .from('patients')
    .select('*')
    .eq('hospital_id', REGAL_HOSPITAL_CODE)
    .ilike('phone', `%${normalized}`)
    .maybeSingle();

  if (altError) throw altError;
  return (altData as Record<string, unknown> | null) ?? null;
}

export function resolveQueuePatientPhone(patient: {
  phone?: string | null;
  patient_phone?: string | null;
}): string {
  return normalizePatientPhone(patient.patient_phone || patient.phone || '');
}
