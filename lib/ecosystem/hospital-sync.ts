'use client';

import type { EcosystemAppointment } from './types';

const HOSPITAL_QUEUE_KEY = 'nexora-hospital-queue-v0';

export type HospitalQueueRow = {
  id: string;
  token: string;
  patient_name: string;
  department: string;
  provider: string;
  scheduled_time: string;
  location: string;
  status: string;
  channels: { sms: boolean; email: boolean; whatsapp: boolean };
  created_at: string;
};

function readHospitalQueue(): HospitalQueueRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HOSPITAL_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as HospitalQueueRow[]) : [];
  } catch {
    return [];
  }
}

function writeHospitalQueue(rows: HospitalQueueRow[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HOSPITAL_QUEUE_KEY, JSON.stringify(rows));
}

export function pushToHospitalQueue(appt: EcosystemAppointment) {
  const row: HospitalQueueRow = {
    id: appt.id,
    token: appt.token,
    patient_name: appt.patientName,
    department: appt.department,
    provider: appt.doctorName,
    scheduled_time: `${appt.date} ${appt.time}`,
    location: appt.location,
    status: appt.status,
    channels: { sms: true, email: true, whatsapp: false },
    created_at: appt.createdAt,
  };

  const existing = readHospitalQueue();
  const idx = existing.findIndex((r) => r.id === appt.id);
  if (idx >= 0) existing[idx] = row;
  else existing.unshift(row);
  writeHospitalQueue(existing);
}

export function getHospitalQueue(): HospitalQueueRow[] {
  return readHospitalQueue();
}

export function updateHospitalQueueStatus(appointmentId: string, status: string) {
  const rows = readHospitalQueue().map((r) => (r.id === appointmentId ? { ...r, status } : r));
  writeHospitalQueue(rows);
}
