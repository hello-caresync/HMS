import type { SupabaseClient } from '@supabase/supabase-js';

import { syncAppointmentToDoctor } from '@/lib/ecosystem/doctor-sync';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import type {
  AppointmentStatus,
  EcosystemAppointment,
  EcosystemNotification,
} from '@/lib/ecosystem/types';
import { mergeEcosystemIntoDoctor } from '@/lib/ecosystem/doctor-sync';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import type { Notification as DoctorNotification } from '@/lib/nexora-doctor/types';

import { normalizeSlotTime } from '@/lib/patient/booking/fetchRealTimeSlots';

export type AppointmentRow = {
  id: string;
  patient_id: string | null;
  doctor_id: string;
  appointment_date: string;
  time_slot: string;
  status: string;
  patient_name?: string | null;
  patient_mrn?: string | null;
  doctor_name?: string | null;
  department?: string | null;
  reason?: string | null;
  token?: string | null;
  visit_type?: string | null;
  ecosystem_status?: string | null;
  updated_at?: string;
};

export type EcoAppointmentRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name: string;
  patient_mrn: string | null;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  end_time: string | null;
  reason: string | null;
  status: string;
  visit_type: string | null;
  token: string | null;
  location: string | null;
  updated_at?: string;
};

export type NotificationRow = {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  title: string;
  body: string;
  category: string;
  read: boolean;
  related_id: string | null;
  target_audience: string;
  created_at: string;
};

function slotStatusToEco(status: string): AppointmentStatus {
  const s = status.toUpperCase();
  if (s === 'CONFIRMED' || s === 'BOOKED') return 'Confirmed';
  if (s === 'IN_CONSULTATION' || s === 'IN CONSULTATION') return 'In Consultation';
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'CANCELLED') return 'Cancelled';
  if (s === 'CHECKED_IN' || s === 'CHECKED-IN') return 'Checked-In';
  return 'Requested';
}

function ecoStatusToSlot(status: AppointmentStatus): string {
  switch (status) {
    case 'Confirmed':
    case 'Checked-In':
      return 'CONFIRMED';
    case 'In Consultation':
      return 'IN_CONSULTATION';
    case 'Completed':
      return 'COMPLETED';
    case 'Cancelled':
      return 'CANCELLED';
    default:
      return 'BOOKED';
  }
}

export function appointmentRowToEco(row: AppointmentRow): EcosystemAppointment | null {
  if (!row.patient_id) return null;
  const time = normalizeSlotTime(String(row.time_slot));
  const end = new Date(`${row.appointment_date}T${time}`);
  end.setMinutes(end.getMinutes() + 30);
  const ecoStatus = (row.ecosystem_status as AppointmentStatus) ?? slotStatusToEco(row.status);

  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name ?? 'Patient',
    patientMrn: row.patient_mrn ?? '',
    doctorId: row.doctor_id,
    doctorName: row.doctor_name ?? 'Doctor',
    department: row.department ?? 'General',
    date: row.appointment_date,
    time,
    endTime: end.toTimeString().slice(0, 5),
    reason: row.reason ?? '',
    status: ecoStatus,
    type: row.visit_type === 'Teleconsult' ? 'Teleconsult' : 'OPD',
    token: row.token ?? '',
    location: 'OPD',
    createdAt: row.updated_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export function ecoRowToEco(row: EcoAppointmentRow): EcosystemAppointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientMrn: row.patient_mrn ?? '',
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    department: row.department,
    date: row.appointment_date,
    time: String(row.appointment_time).slice(0, 5),
    endTime: row.end_time ? String(row.end_time).slice(0, 5) : '',
    reason: row.reason ?? '',
    status: row.status as AppointmentStatus,
    type: row.visit_type === 'Teleconsult' ? 'Teleconsult' : 'OPD',
    token: row.token ?? '',
    location: row.location ?? '',
    createdAt: row.updated_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export function mergeAppointmentsIntoStores(appts: EcosystemAppointment[]) {
  const eco = useEcosystemStore.getState();
  const merged = [...eco.appointments];
  appts.forEach((mapped) => {
    const idx = merged.findIndex((a) => a.id === mapped.id);
    if (idx >= 0) merged[idx] = mapped;
    else merged.push(mapped);
    syncAppointmentToDoctor(mapped);
  });
  useEcosystemStore.setState({ appointments: merged });

  const doctorIds = new Set(appts.map((a) => a.doctorId));
  doctorIds.forEach((doctorId) => mergeEcosystemIntoDoctor(doctorId));
}

export function notificationRowToDoctor(row: NotificationRow): DoctorNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category as DoctorNotification['category'],
    read: row.read,
    at: row.created_at,
    patientId: row.patient_id ?? undefined,
    appointmentId: row.related_id ?? undefined,
    targetHref: row.related_id ? '/doctor/schedule' : undefined,
  };
}

export function notificationRowToPatient(row: NotificationRow): EcosystemNotification {
  return {
    id: row.id,
    patientId: row.patient_id ?? '',
    title: row.title,
    body: row.body,
    category: row.category as EcosystemNotification['category'],
    read: row.read,
    relatedId: row.related_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchAppointmentsForDoctor(
  supabase: SupabaseClient,
  doctorId: string,
): Promise<EcosystemAppointment[]> {
  const [slotRes, ecoRes] = await Promise.all([
    supabase.from('appointments').select('*').eq('doctor_id', doctorId),
    supabase.from('ecosystem_appointments').select('*').eq('doctor_id', doctorId),
  ]);

  const fromSlots = ((slotRes.data ?? []) as AppointmentRow[])
    .map(appointmentRowToEco)
    .filter(Boolean) as EcosystemAppointment[];
  const fromEco = ((ecoRes.data ?? []) as EcoAppointmentRow[]).map(ecoRowToEco);

  const byId = new Map<string, EcosystemAppointment>();
  [...fromSlots, ...fromEco].forEach((a) => byId.set(a.id, a));
  return [...byId.values()];
}

export async function fetchAppointmentsForPatient(
  supabase: SupabaseClient,
  patientId: string,
): Promise<EcosystemAppointment[]> {
  const [slotRes, ecoRes] = await Promise.all([
    supabase.from('appointments').select('*').eq('patient_id', patientId),
    supabase.from('ecosystem_appointments').select('*').eq('patient_id', patientId),
  ]);

  const fromSlots = ((slotRes.data ?? []) as AppointmentRow[])
    .map(appointmentRowToEco)
    .filter(Boolean) as EcosystemAppointment[];
  const fromEco = ((ecoRes.data ?? []) as EcoAppointmentRow[]).map(ecoRowToEco);

  const byId = new Map<string, EcosystemAppointment>();
  [...fromSlots, ...fromEco].forEach((a) => byId.set(a.id, a));
  return [...byId.values()];
}

export async function fetchDoctorNotifications(
  supabase: SupabaseClient,
  doctorId: string,
): Promise<DoctorNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .or(`doctor_id.eq.${doctorId},target_audience.eq.both`)
    .order('created_at', { ascending: false })
    .limit(50);

  return ((data ?? []) as NotificationRow[]).map(notificationRowToDoctor);
}

export async function fetchPatientNotifications(
  supabase: SupabaseClient,
  patientId: string,
): Promise<EcosystemNotification[]> {
  const [custom, eco] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .or(`patient_id.eq.${patientId},target_audience.eq.both`)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('ecosystem_notifications')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const rows = ((custom.data ?? []) as NotificationRow[]).map(notificationRowToPatient);
  const ecoRows = (eco.data ?? []) as Array<{
    id: string;
    patient_id: string;
    title: string;
    body: string;
    category: string;
    read: boolean;
    related_id: string | null;
    created_at: string;
  }>;

  const merged = [
    ...rows,
    ...ecoRows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      title: r.title,
      body: r.body,
      category: r.category as EcosystemNotification['category'],
      read: r.read,
      relatedId: r.related_id ?? undefined,
      createdAt: r.created_at,
    })),
  ];

  const seen = new Set<string>();
  return merged.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

export async function persistCrossAppAppointment(
  supabase: SupabaseClient,
  appt: EcosystemAppointment,
): Promise<void> {
  const slotStatus = ecoStatusToSlot(appt.status);
  const timeSlot = `${normalizeSlotTime(appt.time)}:00`;

  const { error: slotError } = await supabase.from('appointments').upsert(
    {
      id: appt.id,
      patient_id: appt.patientId,
      doctor_id: appt.doctorId,
      appointment_date: appt.date,
      time_slot: timeSlot,
      status: slotStatus,
      patient_name: appt.patientName,
      patient_mrn: appt.patientMrn,
      doctor_name: appt.doctorName,
      department: appt.department,
      reason: appt.reason,
      token: appt.token,
      visit_type: appt.type,
      ecosystem_status: appt.status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (slotError) throw slotError;

  const { error: ecoError } = await supabase.from('ecosystem_appointments').upsert(
    {
      id: appt.id,
      patient_id: appt.patientId,
      doctor_id: appt.doctorId,
      patient_name: appt.patientName,
      patient_mrn: appt.patientMrn,
      doctor_name: appt.doctorName,
      department: appt.department,
      appointment_date: appt.date,
      appointment_time: appt.time,
      end_time: appt.endTime || null,
      reason: appt.reason,
      status: appt.status,
      visit_type: appt.type,
      token: appt.token,
      location: appt.location,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (ecoError) throw ecoError;
}

export async function persistCrossAppNotification(
  supabase: SupabaseClient,
  input: {
    patientId?: string;
    doctorId?: string;
    title: string;
    body: string;
    category: string;
    relatedId?: string;
    targetAudience: 'patient' | 'doctor' | 'both';
  },
): Promise<void> {
  await supabase.from('notifications').insert({
    patient_id: input.patientId ?? null,
    doctor_id: input.doctorId ?? null,
    title: input.title,
    body: input.body,
    category: input.category,
    related_id: input.relatedId ?? null,
    target_audience: input.targetAudience,
    read: false,
  });
}

export function upsertDoctorNotificationsFromDb(items: DoctorNotification[]) {
  if (items.length === 0) return;
  const store = useDoctorClinicalStore.getState();
  const byId = new Map(store.notifications.map((n) => [n.id, n]));
  items.forEach((n) => byId.set(n.id, n));
  useDoctorClinicalStore.setState({ notifications: [...byId.values()] });
}

export function upsertPatientNotificationsFromDb(items: EcosystemNotification[]) {
  if (items.length === 0) return;
  const store = useEcosystemStore.getState();
  const byId = new Map(store.notifications.map((n) => [n.id, n]));
  items.forEach((n) => byId.set(n.id, n));
  useEcosystemStore.setState({ notifications: [...byId.values()] });
}
