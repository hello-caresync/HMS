'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'Request failed');
  }
  return data as T;
}

export function useOpdQueue() {
  return useQuery({
    queryKey: ['opd', 'queue'],
    queryFn: () => fetchJson<{ queue: OpdQueueItem[] }>('/api/opd/consultation'),
  });
}

export type OpdQueueItem = {
  id: string;
  token: string;
  patientId: string;
  patientName: string;
  chiefComplaint: string;
  priority: string;
  waitMinutes: number;
};

export function usePatients(opts?: { search?: string; status?: 'OPD' | 'IPD' | 'EMERGENCY' }) {
  const params = new URLSearchParams();
  if (opts?.search) params.set('search', opts.search);
  if (opts?.status) params.set('status', opts.status);
  const q = params.toString() ? `?${params}` : '';
  return useQuery({
    queryKey: ['patients', opts?.search, opts?.status],
    queryFn: () => fetchJson<{ patients: PatientDto[] }>(`/api/patients${q}`),
  });
}

export type PatientDto = {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
};

export function useIpdAdmissions() {
  return useQuery({
    queryKey: ['ipd', 'admissions'],
    queryFn: () => fetchJson<{ admissions: IpdAdmissionDto[] }>('/api/patients?context=ipd'),
  });
}

export type IpdAdmissionDto = {
  id: string;
  ward: string;
  bed: string;
  losDays: number;
  dailyProgressNotesJson: unknown;
  patient: PatientDto;
};

export function useEmergencyCases() {
  return useQuery({
    queryKey: ['emergency'],
    queryFn: () => fetchJson<{ cases: EmergencyCaseDto[] }>('/api/emergency'),
  });
}

export type EmergencyCaseDto = {
  id: string;
  patientId?: string | null;
  esiLevel: number;
  patientName: string;
  mrn: string;
  presentation: string;
  bay: string;
  statOrdersPending: number;
  vitals: { bp: string; hr: string; gcs: string };
};

export function useNotificationsFeed() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchJson<{ notifications: NotificationDto[] }>('/api/notifications'),
  });
}

export type NotificationDto = {
  id: string;
  category: 'EMERGENCY' | 'CRITICAL_LAB' | 'OT' | 'PATIENT_MSG' | 'ALL';
  title: string;
  body: string;
  at: string;
  patientId?: string;
  acknowledged: boolean;
};

export function useSaveConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchJson<{ encounter: { id: string } }>('/api/opd/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opd', 'queue'] });
    },
  });
}

export function useSendPrescription() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchJson<{ message: string }>('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  });
}

export function useSaveSoapNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { admissionId: string; soap: Record<string, string> }) =>
      fetchJson<{ message: string }>('/api/ipd/soap-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ipd', 'admissions'] });
    },
  });
}

export function useEmergencyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchJson('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useAcknowledgeNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, acknowledged: true }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useGenerateDocument() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchJson<{ previewHtml: string }>('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  });
}

export function usePatientLabOrders(patientId: string | undefined) {
  return useQuery({
    queryKey: ['lab-orders', patientId],
    enabled: !!patientId,
    queryFn: () => fetchJson<{ orders: unknown[] }>(`/api/lab-orders?patientId=${patientId}`),
  });
}

export function useFormulary() {
  return useQuery({
    queryKey: ['formulary'],
    queryFn: () =>
      fetchJson<{
        drugs: {
          id: string;
          brand: string;
          generic: string;
          route: string;
          interactsWith: string[];
          allergyConflict: string[];
        }[];
      }>('/api/formulary'),
  });
}

export function useClinicalMessages(channelId: string) {
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: () =>
      fetchJson<{
        channels: { id: string; name: string; role: string; unread: number; lastMessage: string; lastAt: string }[];
        messages: { id: string; channelId: string; sender: string; body: string; at: string; stat?: boolean }[];
      }>(`/api/messages?channelId=${channelId}`),
  });
}

export function useSendClinicalMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { channelId: string; body: string; stat?: boolean }) =>
      fetchJson('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['messages', vars.channelId] }),
  });
}

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar'],
    queryFn: () =>
      fetchJson<{
        events: { id: string; title: string; type: string; start: string; end: string; location: string }[];
      }>('/api/calendar'),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => fetchJson<{ analytics: Record<string, unknown> }>('/api/analytics'),
  });
}

export function useTelemedicineSession() {
  return useQuery({
    queryKey: ['telemedicine', 'session'],
    queryFn: () =>
      fetchJson<{
        session: {
          appointmentId: string;
          roomId: string;
          patient: PatientDto;
          transcript: { from: string; text: string }[];
        } | null;
      }>('/api/telemedicine'),
  });
}

export function useStatLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchJson('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['lab-orders'] });
    },
  });
}
